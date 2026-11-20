// @vitest-environment node
import { describe, expect, test } from 'vitest'
import { canonicalJson, sha256, snapshotHash } from '@/lib/proposals/hash'
import { rankWork } from '@/lib/proposals/match'
import { amountInput, formatMoney, parseAmount, totalMinor } from '@/lib/proposals/money'
import { effectiveStatus, expiryFrom, isEditable, isVisibleToClient } from '@/lib/proposals/status'
import { fillTemplate, placeholders } from '@/lib/proposals/template'
import { TOKEN_LENGTH, newToken, proposalKey, slugify, tokenFromKey } from '@/lib/proposals/tokens'
import type { Snapshot } from '@/lib/proposals/types'

describe('money', () => {
  test('formats minor units without floating point', () => {
    expect(formatMoney(150000, 'NGN')).toBe('₦1,500.00')
    expect(formatMoney(5, 'USD')).toBe('$0.05')
    expect(formatMoney(123456789, 'USD')).toBe('$1,234,567.89')
    expect(() => formatMoney(1.5, 'USD')).toThrow()
  })

  test('parses typed amounts into minor units', () => {
    expect(parseAmount('1,500')).toBe(150000)
    expect(parseAmount('₦1,500.5')).toBe(150050)
    expect(parseAmount('$20.05')).toBe(2005)
    expect(parseAmount(' 0 ')).toBe(0)
    for (const bad of ['', '-5', '1.234', 'abc', '1e5', '12..3']) expect(parseAmount(bad)).toBeNull()
  })

  test('round-trips through the edit field', () => {
    for (const m of [0, 5, 150000, 150050, 99]) expect(parseAmount(amountInput(m))).toBe(m)
  })

  test('totals milestones and rejects bad amounts', () => {
    expect(totalMinor([{ amountMinor: 10 }, { amountMinor: 20 }])).toBe(30)
    expect(totalMinor([])).toBe(0)
    expect(() => totalMinor([{ amountMinor: -1 }])).toThrow()
    expect(() => totalMinor([{ amountMinor: 0.1 }])).toThrow()
  })
})

describe('tokens and links', () => {
  test('tokens are long, base62 and unique', () => {
    const seen = new Set(Array.from({ length: 500 }, () => newToken()))
    expect(seen.size).toBe(500)
    for (const t of seen) expect(t).toMatch(new RegExp(`^[0-9A-Za-z]{${TOKEN_LENGTH}}$`))
  })

  test('slugs are readable and safe', () => {
    expect(slugify('Acme Foods Ltd.')).toBe('acme-foods-ltd')
    expect(slugify('Café Résumé')).toBe('cafe-resume')
    expect(slugify('!!!')).toBe('client')
  })

  test('the token is recovered from the link whatever the slug says', () => {
    const t = newToken()
    expect(tokenFromKey(proposalKey('acme-foods', t))).toBe(t)
    expect(tokenFromKey(`renamed-client-${t}`)).toBe(t)
    expect(tokenFromKey('acme-short')).toBeNull()
    expect(tokenFromKey(`acme-${t.slice(1)}!`)).toBeNull()
  })
})

describe('contract templates', () => {
  test('fills known placeholders and leaves unknown ones visible', () => {
    const body = 'Between {{ provider }} and {{client}}. Total: {{total}}. {{typo}}'
    expect(placeholders(body)).toEqual(['provider', 'client', 'total', 'typo'])
    expect(fillTemplate(body, { provider: 'Destine', client: 'Acme', total: '₦1.00' })).toBe(
      'Between Destine and Acme. Total: ₦1.00. {{typo}}',
    )
  })
})

describe('matching relevant work', () => {
  test('ranks by shared tags, ties keep the owner’s order, no overlap is dropped', () => {
    const items = [
      { key: 'a', tags: ['payments'] },
      { key: 'b', tags: ['payments', 'marketplace'] },
      { key: 'c', tags: ['events'] },
      { key: 'd', tags: ['marketplace'] },
    ]
    expect(rankWork(items, ['payments', 'marketplace']).map((r) => r.item.key)).toEqual(['b', 'a', 'd'])
  })
})

describe('fingerprints', () => {
  const snap: Snapshot = {
    version: 1,
    issuedAt: '2026-11-20T00:00:00.000Z',
    expiresAt: null,
    provider: { name: 'D', title: 'Dev', email: 'd@x', website: 'https://x' },
    client: { name: 'Acme', logoKey: null, contactName: 'A', contactEmail: 'a@x' },
    intro: 'Hi',
    brief: 'B',
    work: [],
    scope: [{ title: 'S', description: '' }],
    milestones: [{ title: 'M', description: '', amountMinor: 100, due: '' }],
    currency: 'NGN',
    totalMinor: 100,
    contract: 'Terms',
  }

  test('key order does not change the hash; content does', () => {
    expect(canonicalJson({ b: 1, a: { d: 2, c: 3 } })).toBe('{"a":{"c":3,"d":2},"b":1}')
    const { contract, ...rest } = snap
    const reordered = { contract, ...rest } as Snapshot
    expect(snapshotHash(reordered)).toBe(snapshotHash(snap))
    expect(snapshotHash({ ...snap, contract: 'Terms.' })).not.toBe(snapshotHash(snap))
    expect(snapshotHash({ ...snap, totalMinor: 101 })).not.toBe(snapshotHash(snap))
    expect(sha256('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad')
  })
})

describe('status and expiry', () => {
  const now = new Date('2026-11-20T12:00:00Z')
  const past = new Date('2026-11-19T12:00:00Z')
  const future = expiryFrom(now, 14)

  test('sent and viewed proposals expire; signed and withdrawn are final', () => {
    expect(effectiveStatus({ status: 'sent', expiresAt: past }, now)).toBe('expired')
    expect(effectiveStatus({ status: 'viewed', expiresAt: past }, now)).toBe('expired')
    expect(effectiveStatus({ status: 'sent', expiresAt: future }, now)).toBe('sent')
    expect(effectiveStatus({ status: 'signed', expiresAt: past }, now)).toBe('signed')
    expect(effectiveStatus({ status: 'withdrawn', expiresAt: future }, now)).toBe('withdrawn')
    expect(future.toISOString()).toBe('2026-12-04T12:00:00.000Z')
  })

  test('who sees what', () => {
    expect(isVisibleToClient('draft')).toBe(false)
    expect(isVisibleToClient('expired')).toBe(false)
    expect(isVisibleToClient('withdrawn')).toBe(false)
    expect(isVisibleToClient('signed')).toBe(true)
    expect(isEditable('signed')).toBe(false)
    expect(isEditable('withdrawn')).toBe(false)
    expect(isEditable('viewed')).toBe(true)
  })
})

describe('contract text blocks', async () => {
  const { paragraphs, toBlocks } = await import('@/lib/proposals/blocks')
  test('headings, paragraphs joined across lines, and lists', () => {
    expect(toBlocks('# 1. Parties\nThis is\none paragraph.\n\n- a\n- b\nAfter\n\n# 2. Next')).toEqual([
      { type: 'h', text: '1. Parties' },
      { type: 'p', text: 'This is one paragraph.' },
      { type: 'ul', items: ['a', 'b'] },
      { type: 'p', text: 'After' },
      { type: 'h', text: '2. Next' },
    ])
    expect(paragraphs('One\nline\n\n\nTwo  ')).toEqual(['One line', 'Two'])
  })
})
