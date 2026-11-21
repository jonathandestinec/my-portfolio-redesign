// @vitest-environment node
import { expect, test } from 'vitest'
import { buildProposalPdf } from '@/lib/proposals/pdf'
import type { Snapshot } from '@/lib/proposals/types'

const snapshot: Snapshot = {
  schema: 2,
  version: 1,
  issuedAt: '2026-11-20T10:00:00.000Z',
  expiresAt: '2026-12-04T10:00:00.000Z',
  provider: { name: 'Destine Jonathan', title: 'Fullstack developer', email: 'd@x.test', website: 'https://x.test' },
  client: { name: 'Acme', logoKey: null, contactName: 'Ada', contactEmail: 'ada@acme.test' },
  intro: 'Hello.',
  brief: 'A shop that takes ₦ payments.',
  objectives: ['Fewer missed orders'],
  work: [{ key: 'project:huddle', name: 'Huddle', summary: 'Events', note: '', cover: null, caseStudyUrl: 'https://x.test/work/huddle', liveUrl: null }],
  options: ['a', 'b'].map((id, i) => ({
    id,
    name: i ? 'Standard' : 'Essential',
    summary: '',
    deliverables: [{ title: 'Storefront', description: 'Next.js', format: 'Live site' }],
    timeline: [{ title: 'Launch', day: 10 }],
    priceMinor: (i + 1) * 100_000_00,
    recommended: i === 1,
    depositMinor: (i + 1) * 50_000_00,
    balanceMinor: (i + 1) * 50_000_00,
    workingDays: 10,
    contract: '# 1. Parties\nBetween us.\n\n- one\n- two',
  })),
  outOfScope: ['Apps'],
  responsibilities: [{ item: 'Photos', by: 'day 3' }],
  acceptance: ['Works on a phone'],
  terms: { depositPercent: 50, depositDueDays: 3, balanceDueDays: 15, lateFeeBps: 150, stopWorkDays: 10 },
  currency: 'NGN',
}

test('builds a signed PDF with an audit page', async () => {
  const sig = (role: 'client' | 'provider') => ({
    role, optionId: 'b', name: role, email: 'x@x.test', title: null, method: 'typed' as const, signedAt: new Date(), ip: '1.1.1.1', userAgent: 'ua', contentSha256: 'a'.repeat(64), image: null,
  })
  // Compare like with like: a signed PDF shows only the chosen option.
  const unsigned = await buildProposalPdf({ snapshot: { ...snapshot, options: snapshot.options.filter((o) => o.id === 'b') }, logo: null, signatures: [sig('provider')], contentSha256: 'a'.repeat(64) })
  const signed = await buildProposalPdf({ snapshot, logo: null, signatures: [sig('provider'), sig('client')], contentSha256: 'a'.repeat(64) })
  expect(unsigned.subarray(0, 5).toString()).toBe('%PDF-')
  const pages = (b: Buffer) => (b.toString('latin1').match(/\/Type \/Page\b/g) ?? []).length
  expect(pages(unsigned)).toBeGreaterThanOrEqual(2)
  expect(pages(signed)).toBe(pages(unsigned) + 1)
}, 30_000)

test('builds an invoice PDF', async () => {
  const { buildInvoicePdf } = await import('@/lib/proposals/pdf')
  const pdf = await buildInvoicePdf({
    number: '2026-001', kind: 'deposit', issuedAt: new Date(), dueAt: new Date(), paidAt: null, state: 'unpaid', amountMinor: 50_000_00,
    details: {
      from: { businessName: 'Destine Jonathan', phone: '080', email: 'd@x.test', address: '', bankName: 'GTBank', accountName: 'Destine Jonathan', accountNumber: '0123456789' },
      client: { name: 'Acme', contactName: 'Ada', contactEmail: 'ada@acme.test' },
      forTitle: 'Standard: 50% deposit', forLines: ['To start: Storefront (Live site)'],
      amounts: { totalMinor: 100_000_00, depositPaidMinor: 0, thisInvoiceMinor: 50_000_00, balanceAfterMinor: 50_000_00 },
      currency: 'NGN', terms: 'Late payment: 1.5% per month.',
    },
  })
  expect(pdf.subarray(0, 5).toString()).toBe('%PDF-')
}, 30_000)
