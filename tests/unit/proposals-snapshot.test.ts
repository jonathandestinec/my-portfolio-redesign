// @vitest-environment node
import { expect, test } from 'vitest'
import { percentToBps } from '@/lib/proposals/content'
import { buildSnapshot, contractValues, readiness, type CatalogItem } from '@/lib/proposals/snapshot'
import { DEFAULT_TERMS, emptyContent, emptyOption, type ProposalContent } from '@/lib/proposals/types'
import { upgradeContent, upgradeSnapshot } from '@/lib/proposals/upgrade'

const provider = { name: 'Destine Jonathan', title: 'Fullstack developer', email: 'd@example.com', website: 'https://x.test' }
const catalog: CatalogItem[] = [
  { key: 'project:huddle', name: 'Huddle', summary: 'Events', cover: { src: '/c.png', alt: 'c' }, caseStudyUrl: 'https://x.test/work/huddle', liveUrl: null, tags: ['events'] },
  { key: 'client:bam-hire', name: 'BAM Hire', summary: 'Staffing', cover: null, caseStudyUrl: null, liveUrl: 'https://bam.test', tags: [] },
]
const essential = { ...emptyOption('Essential'), id: 'ess', priceMinor: 500_000_00, deliverables: [{ title: 'Ordering page', description: '', format: 'Live site' }], timeline: [{ title: 'Launch', day: 10 }] }
const standard = {
  ...emptyOption('Standard', true),
  id: 'std',
  summary: 'Portal plus dashboard.',
  priceMinor: 1_500_000_50,
  deliverables: [
    { title: 'Ordering portal', description: 'Cart and Paystack checkout', format: 'Live site on your domain' },
    { title: ' ', description: '', format: '' },
  ],
  timeline: [
    { title: 'Design approved', day: 5 },
    { title: 'Launch', day: 20 },
  ],
}
const content: ProposalContent = {
  ...emptyContent(),
  clientName: ' Kora Foods ',
  contactName: 'Amaka',
  contactEmail: 'amaka@kora.test',
  brief: 'Orders come in on WhatsApp and we lose them.',
  objectives: ['Cut missed orders to under 2 a week', ' '],
  work: [{ key: 'client:bam-hire', note: ' Similar ' }, { key: 'project:gone', note: '' }, { key: 'project:huddle', note: '' }],
  options: [essential, standard, { ...emptyOption(), id: 'blank' }],
  outOfScope: ['Mobile apps'],
  responsibilities: [{ item: 'Product photos', by: 'day 3' }],
  acceptance: ['A shop owner can order on a phone'],
  contractBody: '{{overview}}\n{{scopeOut}}\n{{payment}}\n{{timeline}}',
}

test('the snapshot keeps real options only, splits deposits and fills a contract per option', () => {
  const s = buildSnapshot({ content, version: 2, issuedAt: new Date('2026-11-20T10:00:00Z'), expiresAt: null, provider, catalog })
  expect(s.schema).toBe(2)
  expect(s.options.map((o) => o.id)).toEqual(['ess', 'std'])
  expect(s.work.map((w) => [w.key, w.note])).toEqual([['client:bam-hire', 'Similar'], ['project:huddle', '']])
  expect(s.objectives).toEqual(['Cut missed orders to under 2 a week'])
  const std = s.options[1]
  expect(std.deliverables).toHaveLength(1)
  expect(std.depositMinor).toBe(750_000_25)
  expect(std.balanceMinor).toBe(750_000_25)
  expect(std.workingDays).toBe(20)
  expect(std.contract).toContain('Destine Jonathan will deliver the Standard option for Kora Foods within 20 working days of the deposit arriving for ₦1,500,000.50. Portal plus dashboard.')
  expect(std.contract).toContain('- Mobile apps')
  expect(std.contract).toContain('Deposit: 50% (₦750,000.25), due within 3 days of signing')
  expect(std.contract).toContain('1.5% per month')
  expect(std.contract).toContain('Working day 20: Launch')
  expect(s.options[0].contract).toContain('for ₦500,000.00')
})

test('contract values cover every documented placeholder', () => {
  const v = contractValues(content, standard, provider, new Date(), null)
  for (const k of ['overview', 'option', 'objectives', 'scopeIn', 'scopeOut', 'deliverables', 'timeline', 'workingDays', 'responsibilities', 'acceptance', 'payment', 'total', 'deposit', 'balance', 'depositPercent', 'lateFee', 'currency', 'client', 'contact', 'provider', 'providerTitle', 'date', 'validUntil', 'scope', 'milestones'])
    expect(v[k], k).toBeTruthy()
  expect(v.deliverables).toBe('- Ordering portal: Cart and Paystack checkout (delivered as: Live site on your domain)')
  expect(v.responsibilities).toBe('- Product photos (by day 3)')
})

test('readiness lists what blocks sending', () => {
  expect(readiness(content)).toEqual([])
  const empty = readiness(emptyContent())
  expect(empty).toContain('List at least one thing that is out of scope.')
  expect(empty).toContain('Add acceptance criteria.')
  expect(empty).toContain('Essential: add at least one deliverable.')
  expect(readiness({ ...content, options: [{ ...essential, recommended: true }, standard] })).toContain('Recommend one option at most.')
})

test('version 1 proposals upgrade to a single option', () => {
  const v1 = {
    clientName: 'Old Co',
    scope: [{ title: 'Site', description: 'Next.js' }],
    milestones: [{ title: 'Build', description: '', amountMinor: 1000, due: 'Week 2' }, { title: 'Launch', description: '', amountMinor: 500, due: '' }],
    contractBody: 'x',
  }
  const c = upgradeContent(v1)
  expect(c.schema).toBe(2)
  expect(c.clientName).toBe('Old Co')
  expect(c.options).toHaveLength(1)
  expect(c.options[0]).toMatchObject({ priceMinor: 1500, deliverables: [{ title: 'Site', description: 'Next.js', format: '' }], timeline: [{ title: 'Build (Week 2)', day: null }, { title: 'Launch', day: null }] })
  expect(c.terms).toEqual(DEFAULT_TERMS)
  expect(c).not.toHaveProperty('scope')

  const snap = upgradeSnapshot({ version: 1, issuedAt: 'x', expiresAt: null, provider, client: { name: 'Old', logoKey: null, contactName: '', contactEmail: '' }, intro: '', brief: '', work: [], scope: v1.scope, milestones: v1.milestones, currency: 'NGN', totalMinor: 1500, contract: 'Signed terms' })
  expect(snap.terms).toBeNull()
  expect(snap.options[0]).toMatchObject({ contract: 'Signed terms', priceMinor: 1500, depositMinor: 0, balanceMinor: 1500 })
})

test('late fee percent from Studio becomes basis points', () => {
  expect(percentToBps('1.5', 0)).toBe(150)
  expect(percentToBps('2', 0)).toBe(200)
  expect(percentToBps('0.75', 0)).toBe(75)
  expect(percentToBps('abc', 150)).toBe(150)
})
