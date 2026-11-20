// @vitest-environment node
import { expect, test } from 'vitest'
import { buildSnapshot, contractValues, readiness, type CatalogItem } from '@/lib/proposals/snapshot'
import { emptyContent, type ProposalContent } from '@/lib/proposals/types'

const provider = { name: 'Destine Jonathan', title: 'Fullstack developer', email: 'd@example.com', website: 'https://x.test' }
const catalog: CatalogItem[] = [
  { key: 'project:huddle', name: 'Huddle', summary: 'Events', cover: { src: '/c.png', alt: 'c' }, caseStudyUrl: 'https://x.test/work/huddle', liveUrl: null, tags: ['events'] },
  { key: 'client:bam-hire', name: 'BAM Hire', summary: 'Staffing', cover: null, caseStudyUrl: null, liveUrl: 'https://bam.test', tags: [] },
]
const content: ProposalContent = {
  ...emptyContent(),
  clientName: ' Acme ',
  contactName: 'Ada',
  contactEmail: 'ada@acme.test',
  brief: 'A shop',
  work: [{ key: 'client:bam-hire', note: ' Similar ' }, { key: 'project:gone', note: '' }, { key: 'project:huddle', note: '' }],
  scope: [{ title: 'Storefront', description: 'Next.js' }, { title: ' ', description: '' }],
  milestones: [
    { title: 'Design', description: '', amountMinor: 50_000_00, due: 'Week 1' },
    { title: 'Build', description: '', amountMinor: 150_000_50, due: '' },
  ],
  contractBody: 'Between {{provider}} and {{client}} for {{total}}.\n{{milestones}}\n{{scope}}\nUntil {{validUntil}}.',
}

test('the snapshot freezes resolved work in the chosen order and fills the contract', () => {
  const issuedAt = new Date('2026-11-20T10:00:00Z')
  const s = buildSnapshot({ content, version: 2, issuedAt, expiresAt: new Date('2026-12-04T10:00:00Z'), provider, catalog })
  expect(s.work.map((w) => [w.key, w.note])).toEqual([['client:bam-hire', 'Similar'], ['project:huddle', '']])
  expect(s.work[0]).not.toHaveProperty('tags')
  expect(s.client.name).toBe('Acme')
  expect(s.scope).toHaveLength(1)
  expect(s.totalMinor).toBe(200_000_50)
  expect(s.contract).toBe(
    'Between Destine Jonathan and Acme for ₦200,000.50.\n- Design (Week 1): ₦50,000.00\n- Build: ₦150,000.50\n- Storefront: Next.js\nUntil 4 December 2026.',
  )
})

test('contract values cover every documented placeholder', () => {
  const v = contractValues(content, provider, new Date(), null)
  for (const k of ['client', 'contact', 'provider', 'providerTitle', 'total', 'currency', 'date', 'validUntil', 'scope', 'milestones'])
    expect(v[k], k).toBeTruthy()
})

test('readiness lists what blocks sending', () => {
  expect(readiness(content)).toEqual([])
  expect(readiness(emptyContent())).toHaveLength(5)
})
