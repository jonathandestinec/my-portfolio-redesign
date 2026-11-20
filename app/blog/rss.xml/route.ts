import { cacheLife } from 'next/cache'
import { getAllPosts } from '@/lib/posts'
import { buildRss } from '@/lib/rss'
import { siteUrl } from '@/lib/site-url'

async function cachedFeed() {
  'use cache'
  cacheLife('max')
  return buildRss(await getAllPosts(), siteUrl())
}

export async function GET() {
  return new Response(await cachedFeed(), {
    headers: { 'Content-Type': 'application/rss+xml; charset=utf-8' },
  })
}
