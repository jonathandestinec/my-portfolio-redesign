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
  const inv = await import('@/lib/proposals/invoices')
  const disc = await import('@/lib/proposals/discovery')
  const { chosenOption } = await import('@/lib/proposals/service')
  const { emptyOption } = await import('@/lib/proposals/types')
  const { db, schema } = await import('@/lib/proposals/db')
  const { eq, inArray } = await import('drizzle-orm')
  const created: string[] = []
  const discoveries: string[] = []

  afterAll(async () => {
    if (discoveries.length) await db().delete(schema.discoveries).where(inArray(schema.discoveries.id, discoveries))
    for (const id of created) await db().delete(schema.proposals).where(eq(schema.proposals.id, id))
  })

  const owner = { signatureKey: 'test/provider.png', ip: '127.0.0.1', userAgent: 'vitest' }
  const clientSig = (hash: string, optionId: string | null = 'std') => ({
    optionId,
    name: 'Ada Lovelace',
    email: 'ada@acme.test',
    title: 'CEO',
    method: 'typed' as const,
    signatureKey: 'test/client.png',
    ip: '10.0.0.1',
    userAgent: 'vitest',
    contentSha256: hash,
  })
  const options = [
    { ...emptyOption('Essential'), id: 'ess', priceMinor: 400_000_00, deliverables: [{ title: 'Page', description: '', format: 'Live site' }] },
    { ...emptyOption('Standard', true), id: 'std', priceMinor: 1_000_000_00, deliverables: [{ title: 'Portal', description: '', format: 'Live site' }], timeline: [{ title: 'Launch', day: 15 }] },
  ]

  async function sentProposal(clientName: string) {
    const id = await repo.createProposal()
    created.push(id)
    const row = (await repo.getProposal(id))!
    await repo.saveContent(id, { ...row.content, clientName, contactEmail: 'ada@acme.test', brief: 'In their words', objectives: ['O'], options, outOfScope: ['Apps'], acceptance: ['Works'] })
    await repo.sendProposal(id, owner)
    return id
  }

  test('create → send → view → sign with a chosen option, and everything that must be refused', async () => {
    const id = await repo.createProposal()
    created.push(id)
    let row = (await repo.getProposal(id))!
    expect(row.status).toBe('draft')
    expect(row.content.schema).toBe(2)
    expect(row.content.terms.depositPercent).toBe(50)
    expect(row.content.contractBody).toContain('{{overview}}')

    await repo.saveContent(id, { ...row.content, clientName: 'Acme Test', contactEmail: 'ada@acme.test', brief: 'A shop', objectives: ['O'], options, outOfScope: ['Apps'], acceptance: ['Works'] })
    row = (await repo.getProposal(id))!
    expect(row.slug).toBe('acme-test')

    const { version } = await repo.sendProposal(id, owner)
    expect(version).toBe(1)
    row = (await repo.getProposal(id))!
    expect(row.status).toBe('sent')
    const v1 = (await repo.getVersion(id, 1))!
    expect(v1.snapshot.options.map((o) => o.id)).toEqual(['ess', 'std'])
    expect(v1.snapshot.options[1].contract).toContain('Acme Test')
    expect(v1.snapshot.options[1].depositMinor).toBe(500_000_00)
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

    const sigId = await repo.signProposal(id, 2, clientSig(v2.contentSha256, 'std'))
    expect(sigId).toBeTruthy()
    expect(await repo.signProposal(id, 2, clientSig(v2.contentSha256))).toBeNull()

    row = (await repo.getProposal(id))!
    expect(row.status).toBe('signed')
    const sigs = await repo.getSignatures(id, 2)
    expect(sigs.map((s) => s.role).sort()).toEqual(['client', 'provider'])
    expect(sigs.find((s) => s.role === 'client')!.optionId).toBe('std')
    await expect(repo.saveContent(id, row.content)).rejects.toThrow(/signed or withdrawn/)

    // Invoices: deposit on signing, balance on acceptance, each issued once.
    const option = chosenOption(v2.snapshot, 'std')!
    const deposit = (await inv.createDepositInvoice(row, v2.snapshot, option, 'Ada Lovelace'))!
    expect(deposit.number).toMatch(/^\d{4}-\d{3}$/)
    expect(deposit.amountMinor).toBe(500_000_00)
    expect(deposit.details.forTitle).toBe('Standard: 50% deposit')
    expect(deposit.dueAt.getTime() - deposit.issuedAt.getTime()).toBeGreaterThan(2.9 * 86_400_000)
    expect((await inv.createDepositInvoice(row, v2.snapshot, option, 'Ada'))!.id).toBe(deposit.id)

    expect(await inv.markInvoicePaid(deposit.id, 'transfer')).toBeTruthy()
    expect(await inv.markInvoicePaid(deposit.id, 'transfer')).toBeNull()

    expect(await inv.markAccepted(id)).toBe(true)
    expect(await inv.markAccepted(id)).toBe(false)
    const balance = (await inv.createBalanceInvoice((await repo.getProposal(id))!, v2.snapshot, option, 'Ada Lovelace'))!
    expect(balance.amountMinor).toBe(500_000_00)
    expect(balance.details.amounts).toMatchObject({ totalMinor: 1_000_000_00, depositPaidMinor: 500_000_00, balanceAfterMinor: 0 })
    expect(Number(balance.number.slice(5))).toBeGreaterThan(Number(deposit.number.slice(5)))
    expect(await inv.getInvoiceByToken(balance.token)).toMatchObject({ id: balance.id })

    const list = await repo.listProposals()
    const item = list.find((p) => p.id === id)!
    expect(item.views).toBe(1)
    expect(item.status).toBe('signed')
    expect(item.totalMinor).toBe(1_000_000_00)
  }, 90_000)

  test('invoice numbers never repeat, even when issued at the same time', async () => {
    const numbers = await Promise.all(Array.from({ length: 8 }, () => inv.nextInvoiceNumber(2099)))
    expect(new Set(numbers).size).toBe(8)
    for (const n of numbers) expect(n).toMatch(/^2099-\d{3}$/)
    await db().delete(schema.invoiceCounters).where(eq(schema.invoiceCounters.year, 2099))
  }, 60_000)

  test('expired and withdrawn proposals cannot be signed', async () => {
    const id = await sentProposal('Expired Co')
    const v1 = (await repo.getVersion(id, 1))!
    await db().update(schema.proposals).set({ expiresAt: new Date(Date.now() - 1000) }).where(eq(schema.proposals.id, id))
    expect(await repo.signProposal(id, 1, clientSig(v1.contentSha256))).toBeNull()
    await repo.extendProposal(id, 7)
    await repo.withdrawProposal(id)
    expect(await repo.signProposal(id, 1, clientSig(v1.contentSha256))).toBeNull()
    expect((await repo.getProposal(id))!.status).toBe('withdrawn')
  }, 60_000)

  test('version 1 content in the database is upgraded on read', async () => {
    const [row] = await db()
      .insert(schema.proposals)
      .values({ slug: 'old', token: 'OLDTOKEN' + Date.now(), content: { clientName: 'Old Co', scope: [{ title: 'Site', description: '' }], milestones: [{ title: 'Build', description: '', amountMinor: 900, due: '' }] } as never })
      .returning({ id: schema.proposals.id })
    created.push(row.id)
    const p = (await repo.getProposal(row.id))!
    expect(p.content.options[0]).toMatchObject({ priceMinor: 900, deliverables: [{ title: 'Site' }] })
  }, 60_000)

  test('discovery notes start a proposal in the client’s words', async () => {
    const did = await disc.createDiscovery()
    discoveries.push(did)
    const notes = disc.parseDiscovery({
      contactName: 'Tunde',
      contactRole: 'Manager',
      contactEmail: 'tunde@kora.test',
      contactPhone: '',
      metOn: '20 Nov',
      answers: { q1: 'WhatsApp', q2: 'We lose orders in the chat.', q3: 'Twice a day', q4: 'Mrs Bello, the owner', q5: 'Yes' },
      valueNumber: '~20 missed orders a week',
      decisionMaker: 'Mrs Bello',
      followUp: 'yes',
      followUpOn: '27 Nov',
      notes: '',
    })
    await disc.saveDiscovery(did, 'Kora Foods', notes)
    const d = (await disc.getDiscovery(did))!
    const seed = disc.seedFromDiscovery(d)
    expect(seed).toMatchObject({ clientName: 'Kora Foods', contactName: 'Mrs Bello', contactEmail: '', brief: 'We lose orders in the chat.', objectives: ['Fix this: ~20 missed orders a week'], discoveryId: did })
    const pid = await repo.createProposal(seed)
    created.push(pid)
    await disc.linkDiscovery(did, pid)
    const p = (await repo.getProposal(pid))!
    expect(p.content.brief).toBe('We lose orders in the chat.')
    expect(p.content.terms.depositPercent).toBe(50)
    expect((await disc.getDiscovery(did))!.proposalId).toBe(pid)
    expect(() => disc.parseDiscovery({ ...notes, followUp: 'definitely' })).toThrow()
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
