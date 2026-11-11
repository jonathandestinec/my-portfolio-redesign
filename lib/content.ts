import { projects } from '@/content/projects'
import type {
  Img,
  PlaygroundItem,
  Project,
  StackCategory,
  StackItem,
} from '@/content/types'

export function getProject(slug: string): Project | undefined {
  return projects.find((p) => p.slug === slug)
}

export function getNextProject(slug: string): Project | null {
  if (projects.length < 2) return null
  const i = projects.findIndex((p) => p.slug === slug)
  if (i === -1) return null
  return projects[(i + 1) % projects.length]
}

export type CarouselSlide = { image: Img; tag: string; href: string; phone?: boolean }

export function homeSlides(): CarouselSlide[] {
  if (projects.length === 1) {
    const p = projects[0]
    return p.slides.map((s) => ({
      image: { src: s.src, alt: s.alt },
      phone: s.phone,
      tag: `${p.name} · ${s.screen}`,
      href: `/work/${p.slug}`,
    }))
  }
  return projects.map((p) => ({
    image: p.cover,
    tag: `${p.name} (${p.context})`,
    href: `/work/${p.slug}`,
  }))
}

export function rangeLabel(start: string, end: string): string {
  return start === end ? start : `${start} – ${end}`
}

export function filterStack(items: StackItem[], cat: StackCategory | 'all'): StackItem[] {
  return cat === 'all' ? items : items.filter((i) => i.category === cat)
}

export function groupPlayground(items: PlaygroundItem[]): {
  client: PlaygroundItem[]
  experiment: PlaygroundItem[]
} {
  return {
    client: items.filter((i) => i.group === 'client'),
    experiment: items.filter((i) => i.group === 'experiment'),
  }
}
