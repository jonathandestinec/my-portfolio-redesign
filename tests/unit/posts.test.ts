import { expect, test } from 'vitest'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { groupByYear, listPublishedSlugs, listSlugs, parseMeta, type Post } from '@/lib/posts'
import { readingMinutes } from '@/lib/reading-time'

const p = (date: string): Post => ({
  slug: date,
  title: date,
  date,
  summary: 's',
  tags: [],
  draft: false,
  readingMinutes: 1,
})

test('invalid frontmatter names the file', () =>
  expect(() => parseMeta('bad', { title: '' })).toThrow('content/blog/bad.mdx'))
test('groups by year desc', () =>
  expect(
    groupByYear([p('2025-01-01'), p('2026-03-01'), p('2026-01-01')]).map(([y, ps]) => [y, ps.length]),
  ).toEqual([
    ['2026', 2],
    ['2025', 1],
  ]))
test('reading time ignores code and exports', () =>
  expect(
    readingMinutes('export const meta = {}\n' + 'word '.repeat(440) + '\n```\n' + 'x '.repeat(5000) + '\n```'),
  ).toBe(2))
test('listSlugs finds seeded posts', () =>
  expect(listSlugs()).toEqual(expect.arrayContaining(['agrohub-payment-held-until-delivery', 'n8n-chat-intake'])))

test('reading time strips a multi-line export', () =>
  expect(
    readingMinutes("export const meta = {\n  title: 'a long title here',\n  summary: 'many words '.repeat(300),\n}\n\n" + 'word '.repeat(220)),
  ).toBe(1))

test('listPublishedSlugs excludes drafts', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'posts-'))
  const meta = (draft: boolean) => `export const meta = { title: 'T', date: '2026-01-01', summary: 's', tags: ['draft: true'], draft: ${draft} }\n\nBody draft: true\n`
  fs.writeFileSync(path.join(dir, 'live.mdx'), meta(false))
  fs.writeFileSync(path.join(dir, 'wip.mdx'), meta(true))
  expect(listSlugs(dir)).toEqual(['live', 'wip'])
  expect(listPublishedSlugs(dir)).toEqual(['live'])
  fs.rmSync(dir, { recursive: true })
})
test('listPublishedSlugs includes the seeded posts', () =>
  expect(listPublishedSlugs()).toEqual(expect.arrayContaining(['n8n-chat-intake'])))
