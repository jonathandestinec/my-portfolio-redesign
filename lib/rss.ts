import type { Post } from '@/lib/posts'

export function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}

export function buildRss(posts: Post[], base: string): string {
  const items = posts
    .filter((p) => !p.draft)
    .map((p) => {
      const url = `${base}/blog/${p.slug}`
      return `    <item>
      <title>${escapeXml(p.title)}</title>
      <description>${escapeXml(p.summary)}</description>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${new Date(`${p.date}T00:00:00Z`).toUTCString()}</pubDate>
    </item>`
    })
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Destine Jonathan — Writing</title>
    <link>${base}/blog</link>
    <description>Notes on building fullstack apps and automations.</description>
${items}
  </channel>
</rss>
`
}
