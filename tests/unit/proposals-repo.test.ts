// @vitest-environment node
/**
 * Integration test against a real database: the Neon "dev" branch from
 * .env.local (never production). Skipped when no DATABASE_URL is available.
 */
import fs from 'node:fs'
import { afterAll, describe, expect, test } from 'vitest'

if (!process.env.DATABASE_URL && fs.existsSync('.env.local')) process.loadEnvFile('.env.local')
const enabled = Boolean(process.env.DATABASE_URL) && !process.env.VERCEL

describe.skipIf(!enabled)('proposal lifecycle (database)', async () => {
  const repo = await import('@/lib/proposals/repo')
  const { db, schema } = await import('@/lib/proposals/db')
  const { eq } = await import('drizzle-orm')
  const created: string[] = []

  afterAll(async () => {
    for (const id of created) await db().delete(schema.proposals).where(eq(schema.proposals.id, id))
  })

  const owner = { signatureKey: 'test/provider.png', ip: '127.0.0.1', userAgent: 'vitest' }
  const clientSig = (hash: string) => ({
    name: 'Ada Lovelace',
    email: 'ada@acme.test',
    title: 'CEO',
    method: 'typed' as const,
    signatureKey: 'test/client.png',
    ip: '10.0.0.1',
    userAgent: 'vitest',
    contentSha256: hash,
  })

  test('create → send → view → sign, and everything that must be refused', async () => {
    const id = await repo.createProposal()
    created.push(id)
    let row = (await repo.getProposal(id))!
    expect(row.status).toBe('draft')
    expect(row.content.contractBody).toContain('{{client}}')

    await repo.saveContent(id, {
      ...row.content,
      clientName: 'Acme Test',
      contactEmail: 'ada@acme.test',
      brief: 'A shop',
      milestones: [{ title: 'Build', description: '', amountMinor: 1000, due: '' }],
    })
    row = (await repo.getProposal(id))!
    expect(row.slug).toBe('acme-test')

    const { version } = await repo.sendProposal(id, owner)
    expect(version).toBe(1)
    row = (await repo.getProposal(id))!
    expect(row.status).toBe('sent')
    expect(row.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 13 * 86400_000)
    const v1 = (await repo.getVersion(id, 1))!
    expect(v1.snapshot.contract).toContain('Acme Test')
    expect(v1.snapshot.totalMinor).toBe(1000)
    expect(await repo.hasUnsentChanges(row)).toBe(false)

    await repo.recordView(row, 'iphash', 'vitest')
    expect((await repo.getProposal(id))!.status).toBe('viewed')

    // Edit and resend: version 2 is current, version 1 can no longer be signed.
    await repo.saveContent(id, { ...row.content, brief: 'A bigger shop' })
    expect(await repo.hasUnsentChanges((await repo.getProposal(id))!)).toBe(true)
    await repo.sendProposal(id, owner)
    const v2 = (await repo.getVersion(id, 2))!
    expect(await repo.signProposal(id, 1, clientSig(v1.contentSha256))).toBeNull()
    expect(await repo.signProposal(id, 2, clientSig('0'.repeat(64)))).toBeNull()

    const sigId = await repo.signProposal(id, 2, clientSig(v2.contentSha256))
    expect(sigId).toBeTruthy()
    expect(await repo.signProposal(id, 2, clientSig(v2.contentSha256))).toBeNull()

    row = (await repo.getProposal(id))!
    expect(row.status).toBe('signed')
    const sigs = await repo.getSignatures(id, 2)
    expect(sigs.map((s) => s.role).sort()).toEqual(['client', 'provider'])
    await expect(repo.saveContent(id, row.content)).rejects.toThrow(/signed or withdrawn/)
    await repo.withdrawProposal(id)
    expect((await repo.getProposal(id))!.status).toBe('signed')

    const list = await repo.listProposals()
    const item = list.find((p) => p.id === id)!
    expect(item.views).toBe(1)
    expect(item.status).toBe('signed')
  }, 60_000)

  test('expired and withdrawn proposals cannot be signed', async () => {
    const id = await repo.createProposal()
    created.push(id)
    const row = (await repo.getProposal(id))!
    await repo.saveContent(id, { ...row.content, clientName: 'Expired Co', milestones: [] })
    await repo.sendProposal(id, owner)
    const v1 = (await repo.getVersion(id, 1))!
    await db().update(schema.proposals).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.proposals.id, id))
    expect(await repo.signProposal(id, 1, clientSig(v1.contentSha256))).toBeNull()

    await repo.extendProposal(id, 7)
    await repo.withdrawProposal(id)
    expect(await repo.signProposal(id, 1, clientSig(v1.contentSha256))).toBeNull()
    expect((await repo.getProposal(id))!.status).toBe('withdrawn')
  }, 60_000)

  test('duplicate copies the content but not the client’s contact details', async () => {
    const id = await repo.createProposal()
    created.push(id)
    const row = (await repo.getProposal(id))!
    await repo.saveContent(id, { ...row.content, clientName: 'Orig', contactEmail: 'o@x.test', brief: 'Keep me' })
    const copy = await repo.duplicateProposal(id)
    created.push(copy)
    const c = (await repo.getProposal(copy))!
    expect(c.content.brief).toBe('Keep me')
    expect(c.content.contactEmail).toBe('')
    expect(c.token).not.toBe(row.token)
    await repo.deleteDraft(copy)
    expect(await repo.getProposal(copy)).toBeNull()
  }, 60_000)
})
