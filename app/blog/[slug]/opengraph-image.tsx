import { notFound } from 'next/navigation'
import { getAllPosts, listPublishedSlugs } from '@/lib/posts'
import { ogContentType, ogSize, renderOg } from '@/lib/og'

export const alt = 'Post by Destine Jonathan'
export const size = ogSize
export const contentType = ogContentType

export function generateStaticParams() {
  return listPublishedSlugs().map((slug) => ({ slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = (await getAllPosts()).find((p) => p.slug === slug)
  if (!post) notFound()
  return renderOg(post.title)
}
