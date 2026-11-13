import { projects } from '@/content/projects'
import { site } from '@/content/site'
import type {
  Img,
  PlaygroundItem,
  Project,
  RichText,
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

/** One slide per featured project (its cover), in project order. */
export function homeSlides(): CarouselSlide[] {
  return projects.map((p) => ({
    image: p.cover,
    tag: p.name,
    href: `/work/${p.slug}`,
  }))
}

/**
 * Home hero statements, built from the projects list so a new project slots in
 * without rewriting copy: the two newest are named and linked, and the last
 * line (with the hand note) points at everything else.
 */
export function heroStatements(): RichText[] {
  const named = projects.slice(0, 2)
  const lately: RichText = ['Lately: ']
  named.forEach((p, i) => {
    if (i > 0) lately.push(', and ')
    lately.push({ text: p.name, href: `/work/${p.slug}` }, `, ${p.blurb}`)
  })
  lately.push('.')
  return [
    [site.hero.intro],
    lately,
    ['More on the way. ', { text: 'See all my work', href: '/works', note: 'check this out :)' }],
  ]
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
