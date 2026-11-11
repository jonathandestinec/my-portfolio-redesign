// @vitest-environment node
import { expect, test } from 'vitest'
import { buildResumePdf } from '@/lib/resume/build'

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
