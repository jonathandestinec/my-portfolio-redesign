import educationData from './education.json'
import experienceData from './experience.json'
import type { Education, Logo, Role } from './types'

/** Logo as stored by the admin panel: an uploaded image, or initials when there is none. */
type StoredLogo = { image: string | null; initials: string }

const toLogo = (l: StoredLogo): Logo =>
  l.image ? { src: l.image } : { initials: l.initials.trim() || '?' }

/** Empty strings from the admin panel mean "not set". */
const opt = (s: string | null | undefined) => (s ? s : undefined)

/** Roles, in display order. Edited in the admin panel ("Experience"), stored in content/experience.json. */
export const experience: Role[] = experienceData.roles.map((r) => ({
  slug: r.slug,
  start: r.start,
  end: r.end,
  title: r.title,
  company: r.company,
  companyUrl: opt(r.companyUrl),
  logo: toLogo(r.logo),
  type: opt(r.type),
  location: opt(r.location),
  summary: r.summary,
  details: r.details,
  highlights: r.highlights,
  stack: r.stack,
}))

/** Courses and studies, in display order. Edited in the admin panel ("Education"), stored in content/education.json. */
export const education: Education[] = educationData.items.map((e) => ({
  slug: e.slug,
  date: e.date,
  course: e.course,
  institution: e.institution,
  institutionUrl: opt(e.institutionUrl),
  logo: toLogo(e.logo),
  location: e.location,
  summary: e.summary,
  details: e.details,
  highlights: e.highlights,
}))
