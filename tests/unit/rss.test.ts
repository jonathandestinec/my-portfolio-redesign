import { describe, expect, it } from 'vitest'
import { buildRss, escapeXml } from '@/lib/rss'
import type { Post } from '@/lib/posts'

const mk = (slug: string, over: Partial<Post> = {}): Post => ({
  slug, title: `T ${slug}`, date: '2026-03-02', summary: 'S', tags: [], draft: false, readingMinutes: 1, ...over,
})

describe('escapeXml', () => {
  it('escapes & < > " \'', () => {
    expect(escapeXml(`a & b < c > d "e" 'f'`)).toBe('a &amp; b &lt; c &gt; d &quot;e&quot; &apos;f&apos;')
  })
})

describe('buildRss', () => {
  const posts = [mk('a'), mk('b', { title: 'R&D <x>' }), mk('c', { draft: true })]
  const xml = buildRss(posts, 'https://x.test')
  it('has one item per non-draft post', () => {
    expect(xml.match(/<item>/g)).toHaveLength(2)
  })
  it('formats links, guid and pubDate', () => {
    expect(xml).toContain('<link>https://x.test/blog/a</link>')
    expect(xml).toContain('<guid isPermaLink="true">https://x.test/blog/a</guid>')
    expect(xml).toContain('<pubDate>Mon, 02 Mar 2026 00:00:00 GMT</pubDate>')
    expect(xml).toContain('R&amp;D &lt;x&gt;')
    expect(xml).toContain('<link>https://x.test/blog</link>')
    expect(xml).toContain('<title>Destine Jonathan — Writing</title>')
    expect(xml).toContain('xmlns:atom="http://www.w3.org/2005/Atom"')
    expect(xml).toContain('<atom:link href="https://x.test/blog/rss.xml" rel="self" type="application/rss+xml"/>')
    expect(xml).toContain('<language>en</language>')
  })
})
