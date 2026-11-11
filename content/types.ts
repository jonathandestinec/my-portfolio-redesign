export type Img = { src: string; alt: string }

export type RichText = Array<string | { text: string; href: string }>

export type Site = {
  firstName: string
  lastName: string
  role: string
  email: string
  calendarUrl: string
  githubUsername: string
  socials: { github: string; linkedin: string; x: string }
  hero: { lead: string; statements: RichText[]; status: string[] }
}

export type Slide = Img & { screen: string }

export type Timeline = {
  columns: string[]
  rows: { track: string; start: number; span: number }[]
}

export type Project = {
  slug: string
  name: string
  context: string
  summary: string
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

export type Role = {
  start: string
  end: string
  title: string
  company: string
  summary: string
  location?: string
}

export type Education = {
  date: string
  course: string
  institution: string
  location: string
}

export type StackCategory = 'frontend' | 'backend' | 'tools' | 'design'

/** icon = simple-icons slug, or 'terminal' | 'key' */
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
