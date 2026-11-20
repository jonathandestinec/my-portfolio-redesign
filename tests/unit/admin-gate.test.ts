// @vitest-environment node
import { expect, test } from 'vitest'
import { decide, gateEnabled, isAdminPath, isProposalPath } from '@/lib/admin-gate'

const env = { entryPath: '/studio-abc12345', token: 'x'.repeat(48) }

test('admin paths are Studio (/keystatic) and the proposals admin (/desk) only', () => {
  for (const p of ['/keystatic', '/keystatic/branch/master', '/api/keystatic', '/api/keystatic/github/login', '/desk', '/desk/abc/preview', '/api/desk/abc/pdf'])
    expect(isAdminPath(p)).toBe(true)
  for (const p of ['/', '/keystatics', '/api/keystaticx', '/works', '/studio-abc12345', '/desks', '/p/acme-x', '/api/p/acme-x/pdf'])
    expect(isAdminPath(p)).toBe(false)
})

test('client proposal pages are recognised for noindex headers', () => {
  expect(isProposalPath('/p/acme-abc')).toBe(true)
  expect(isProposalPath('/api/p/acme-abc/sign')).toBe(true)
  expect(isProposalPath('/projects')).toBe(false)
  expect(isProposalPath('/p')).toBe(false)
})

test('visitors get a 404 on admin paths; other pages pass through', () => {
  expect(decide('/keystatic', undefined, env)).toEqual({ kind: 'not-found' })
  expect(decide('/api/keystatic/github/login', 'wrong', env)).toEqual({ kind: 'not-found' })
  expect(decide('/works', undefined, env)).toEqual({ kind: 'pass' })
  expect(decide('/studio-wrong999', undefined, env)).toEqual({ kind: 'pass' })
})

test('the entry address hands out the token; the token opens the panel', () => {
  expect(decide('/studio-abc12345', undefined, env)).toEqual({ kind: 'enter', token: env.token })
  expect(decide('/keystatic', env.token, env)).toEqual({ kind: 'admin' })
  expect(decide('/api/keystatic/github/oauth/callback', env.token, env)).toEqual({ kind: 'admin' })
})

test('without a valid gate config the panel is closed in production and open only in dev', () => {
  for (const bad of [{}, { entryPath: '/short', token: 'x'.repeat(48) }, { entryPath: '/studio-abc12345', token: 'short' }]) {
    expect(gateEnabled(bad)).toBe(false)
    expect(decide('/keystatic', undefined, bad)).toEqual({ kind: 'not-found' })
    expect(decide('/keystatic', undefined, { ...bad, dev: true })).toEqual({ kind: 'admin' })
  }
  // An unset gate never turns some other page into an entry address.
  expect(decide('/studio-abc12345', undefined, {})).toEqual({ kind: 'pass' })
})
