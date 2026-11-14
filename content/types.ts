export type Img = { src: string; alt: string; width?: number; height?: number }

/** A link inside display text; `note` hangs a handwritten "check this out" under it. */
export type RichLink = { text: string; href: string; note?: string }

export type RichText = Array<string | RichLink>

export type Site = {
  firstName: string
  lastName: string
  role: string
  email: string
  calendarUrl: string
  githubUsername: string
  socials: { github: string; linkedin: string; x: string }
  /** Hero statements are built from the projects list (lib/content heroStatements). */
  hero: { lead: string; intro: string; status: string[] }
}

export type Slide = Img & { screen: string; phone?: boolean }

export type Timeline = {
  columns: string[]
  rows: { track: string; start: number; span: number }[]
}

export type Chapter = {
  id: string
  title: string
  text: string
  /** Screens shown under the chapter; 1 = full width, 2+ = side by side. */
  images: (Img & { phone?: boolean })[]
}

export type Project = {
  slug: string
  name: string
  /** Short clause for the home hero, after the name: "Huddle, {blurb}". */
  blurb: string
  /** Second half of the case-study title: "AgroHub: {tagline}". */
  tagline: string
  context: string
  summary: string
  /** Case-study paragraphs under the title. */
  story: string[]
  chapters: Chapter[]
  cover: Img
  slides: Slide[]
  role: string
  stack: string[]
  year: string
  status: 'in-progress' | 'shipped'
  links: { live?: string; repo?: string }
  images: (Img & { caption?: string })[]
  timeline?: Timeline
}

/** Square logo in /public/logos, or initials shown on a plain tile when there is none yet. */
export type Logo = { src: string } | { initials: string }

export type Role = {
  slug: string
  start: string
  end: string
  title: string
  company: string
  companyUrl?: string
  logo: Logo
  /** e.g. "Internship", "Contract", "Programme" */
  type?: string
  location?: string
  summary: string
  /** Longer write-up shown when the entry is opened. */
  details: string
  highlights: string[]
  stack: string[]
}

export type Education = {
  slug: string
  date: string
  course: string
  institution: string
  institutionUrl?: string
  logo: Logo
  location: string
  summary: string
  details: string
  highlights: string[]
}

export type StackCategory = 'frontend' | 'backend' | 'tools' | 'design'

/** icon = simple-icons slug, or a built-in: 'terminal' | 'key' | 'card' | 'check' */
export type StackItem = { name: string; category: StackCategory; icon: string }

export type PlaygroundItem = {
  name: string
  group: 'client' | 'experiment'
  role: string
  summary: string
  stack?: string[]
  url?: string
  repo?: string
}
