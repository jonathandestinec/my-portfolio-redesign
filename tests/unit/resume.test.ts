// @vitest-environment node
import { expect, test } from 'vitest'
import { buildResumePdf, resumeData } from '@/lib/resume/build'

const text = (b: Uint8Array) => Buffer.from(b).toString('latin1')
const pages = (s: string) => (s.match(/\/Type\s*\/Page[^s]/g) ?? []).length

test('builds a one-page PDF with no phone', async () => {
  const b = await buildResumePdf()
  const s = text(b)
  expect(s.startsWith('%PDF')).toBe(true)
  expect(b.byteLength).toBeGreaterThan(3000)
  expect(pages(s)).toBe(1)
  expect(s).not.toMatch(/2347043970102/)
}, 20000)

test('uncompressed build exposes the name, still one page, no phone', async () => {
  const s = text(await buildResumePdf({ compress: false }))
  expect(pages(s)).toBe(1)
  expect(s).not.toMatch(/2347043970102|\+?234\d{6,}/)
  expect(s).toContain('Destine Jonathan')
}, 20000)

test('résumé links to the live site, not the old placeholder domain', () => {
  const before = process.env.NEXT_PUBLIC_SITE_URL
  delete process.env.NEXT_PUBLIC_SITE_URL
  try {
    expect(resumeData().siteUrl).toBe('https://destinejc.vercel.app')
  } finally {
    if (before !== undefined) process.env.NEXT_PUBLIC_SITE_URL = before
  }
})

test('NEXT_PUBLIC_SITE_URL overrides the default, without a trailing slash', () => {
  const before = process.env.NEXT_PUBLIC_SITE_URL
  process.env.NEXT_PUBLIC_SITE_URL = 'https://example.org/'
  try {
    expect(resumeData().siteUrl).toBe('https://example.org')
  } finally {
    if (before === undefined) delete process.env.NEXT_PUBLIC_SITE_URL
    else process.env.NEXT_PUBLIC_SITE_URL = before
  }
})
