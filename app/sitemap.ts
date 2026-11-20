import type { MetadataRoute } from 'next'
import { projects } from '@/content/projects'
import { getAllPosts } from '@/lib/posts'
import { siteUrl } from '@/lib/site-url'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = siteUrl()
  const posts = await getAllPosts()
  return [
    { url: `${base}/` },
    ...['/works', '/experience', '/education', '/stack', '/contact'].map((p) => ({ url: `${base}${p}` })),
    { url: `${base}/blog` },
    ...projects.map((p) => ({ url: `${base}/work/${p.slug}` })),
    ...posts.map((p) => ({ url: `${base}/blog/${p.slug}`, lastModified: new Date(`${p.date}T00:00:00Z`) })),
  ]
}
