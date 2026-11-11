import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { readingMinutes } from '@/lib/reading-time'

const PostMeta = z.object({
  title: z.string().min(1),
  date: z.iso.date(),
  summary: z.string().min(1),
  tags: z.array(z.string()).default([]),
  draft: z.boolean().default(false),
})

export type PostMeta = z.infer<typeof PostMeta>
export type Post = PostMeta & { slug: string; readingMinutes: number }

const BLOG_DIR = path.join(process.cwd(), 'content', 'blog')

export function listSlugs(dir: string = BLOG_DIR): string[] {
  return fs
    .readdirSync(/*turbopackIgnore: true*/ dir)
    .filter((f) => f.endsWith('.mdx'))
    .map((f) => f.replace(/\.mdx$/, ''))
    .sort()
}

export function parseMeta(slug: string, raw: unknown): PostMeta {
  const r = PostMeta.safeParse(raw)
  if (!r.success) {
    const issues = r.error.issues.map((i) => `${i.path.join('.') || '(root)'}: ${i.message}`).join('; ')
    throw new Error(`Invalid frontmatter in content/blog/${slug}.mdx: ${issues}`)
  }
  return r.data
}

export async function getAllPosts(opts: { includeDrafts?: boolean } = {}): Promise<Post[]> {
  const includeDrafts = opts.includeDrafts ?? process.env.NODE_ENV === 'development'
  const posts = await Promise.all(
    listSlugs().map(async (slug) => {
      const mod = await import(`@/content/blog/${slug}.mdx`)
      const meta = parseMeta(slug, mod.meta)
      const source = fs.readFileSync(/*turbopackIgnore: true*/ path.join(BLOG_DIR, `${slug}.mdx`), 'utf8')
      return { ...meta, slug, readingMinutes: readingMinutes(source) }
    }),
  )
  return posts
    .filter((p) => includeDrafts || !p.draft)
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0))
}

export function groupByYear(posts: Post[]): [year: string, posts: Post[]][] {
  const map = new Map<string, Post[]>()
  for (const p of posts) {
    const y = p.date.slice(0, 4)
    map.set(y, [...(map.get(y) ?? []), p])
  }
  return [...map.entries()].sort(([a], [b]) => (a < b ? 1 : -1))
}

export function formatDate(iso: string, withYear = false): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    ...(withYear ? { year: 'numeric' } : {}),
    timeZone: 'UTC',
  }).format(new Date(`${iso}T00:00:00Z`))
}
