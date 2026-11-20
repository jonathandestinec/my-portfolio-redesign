import { notFound } from 'next/navigation'
import { projects } from '@/content/projects'
import { ogContentType, ogSize, renderOg } from '@/lib/og'

export const alt = 'Project by Destine Jonathan'
export const size = ogSize
export const contentType = ogContentType

export function generateStaticParams() {
  return projects.map((p) => ({ slug: p.slug }))
}

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const project = projects.find((p) => p.slug === slug)
  if (!project) notFound()
  return renderOg(project.name)
}
