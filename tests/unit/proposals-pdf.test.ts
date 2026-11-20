// @vitest-environment node
import { expect, test } from 'vitest'
import { buildProposalPdf } from '@/lib/proposals/pdf'
import type { Snapshot } from '@/lib/proposals/types'

const snapshot: Snapshot = {
  version: 1,
  issuedAt: '2026-11-20T10:00:00.000Z',
  expiresAt: '2026-12-04T10:00:00.000Z',
  provider: { name: 'Destine Jonathan', title: 'Fullstack developer', email: 'd@x.test', website: 'https://x.test' },
  client: { name: 'Acme', logoKey: null, contactName: 'Ada', contactEmail: 'ada@acme.test' },
  intro: 'Hello.',
  brief: 'A shop that takes ₦ payments.',
  work: [{ key: 'project:huddle', name: 'Huddle', summary: 'Events', note: '', cover: null, caseStudyUrl: 'https://x.test/work/huddle', liveUrl: null }],
  scope: [{ title: 'Storefront', description: 'Next.js' }],
  milestones: [{ title: 'Build', description: '', amountMinor: 150_000_00, due: 'Week 2' }],
  currency: 'NGN',
  totalMinor: 150_000_00,
  contract: '# 1. Parties\nBetween us.\n\n- one\n- two',
}

test('builds a signed PDF with an audit page', async () => {
  const sig = (role: 'client' | 'provider') => ({
    role, name: role, email: 'x@x.test', title: null, method: 'typed' as const, signedAt: new Date(), ip: '1.1.1.1', userAgent: 'ua', contentSha256: 'a'.repeat(64), image: null,
  })
  const unsigned = await buildProposalPdf({ snapshot, logo: null, signatures: [sig('provider')], contentSha256: 'a'.repeat(64) })
  const signed = await buildProposalPdf({ snapshot, logo: null, signatures: [sig('provider'), sig('client')], contentSha256: 'a'.repeat(64) })
  expect(unsigned.subarray(0, 5).toString()).toBe('%PDF-')
  const pages = (b: Buffer) => (b.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length
  expect(pages(unsigned)).toBe(2)
  expect(pages(signed)).toBe(3)
}, 30_000)
