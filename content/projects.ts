import fs from 'node:fs'
import path from 'node:path'
import type { Project } from './types'

/**
 * Featured projects, one JSON file each in content/projects/ (the file name is
 * the slug). Edited in the admin panel ("Projects"). Sorted by `order`, lowest
 * first: the first two are named in the home hero.
 *
 * Read from disk so a project added in the admin panel needs no code change;
 * next.config.ts traces content/ into every server function.
 */
const DIR = path.join(process.cwd(), 'content', 'projects')

type Stored = {
  name: string
  order: number
  blurb: string
  tagline: string
  context: string
  summary: string
  cover: { image: string | null; alt: string }
  story: string[]
  chapters: { id: string; title: string; text: string; images: { image: string | null; alt: string; phone: boolean }[] }[]
  role: string
  stack: string[]
  year: string
  status: string
  links: { live: string | null; repo: string | null }
}

function toProject(slug: string, p: Stored): Project {
  if (!p.cover.image) throw new Error(`content/projects/${slug}.json: a cover image is required`)
  return {
    slug,
    name: p.name,
    blurb: p.blurb,
    tagline: p.tagline,
    context: p.context,
    summary: p.summary,
    cover: { src: p.cover.image, alt: p.cover.alt },
    story: p.story.filter((s) => s.trim()),
    chapters: p.chapters.map((c) => ({
      id: c.id,
      title: c.title,
      text: c.text,
      images: c.images
        .filter((im) => im.image)
        .map((im) => ({ src: im.image as string, alt: im.alt, phone: im.phone || undefined })),
    })),
    role: p.role,
    stack: p.stack,
    year: p.year,
    status: p.status === 'shipped' ? 'shipped' : 'in-progress',
    links: { live: p.links.live || undefined, repo: p.links.repo || undefined },
  }
}

export function loadProjects(): Project[] {
  return fs
    .readdirSync(/*turbopackIgnore: true*/ DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const slug = f.replace(/\.json$/, '')
      const raw = JSON.parse(
        fs.readFileSync(/*turbopackIgnore: true*/ path.join(process.cwd(), 'content', 'projects', `${slug}.json`), 'utf8'),
      ) as Stored
      return { order: Number(raw.order) || 0, project: toProject(slug, raw) }
    })
    .sort((a, b) => a.order - b.order || a.project.slug.localeCompare(b.project.slug))
    .map((x) => x.project)
}

export const projects: Project[] = loadProjects()
