import type { StackCategory, StackItem } from './types'

const f = (name: string, icon: string): StackItem => ({ name, category: 'frontend', icon })
const b = (name: string, icon: string): StackItem => ({ name, category: 'backend', icon })
const t = (name: string, icon: string): StackItem => ({ name, category: 'tools', icon })
const d = (name: string, icon: string): StackItem => ({ name, category: 'design', icon })

export const stackCategories: { id: StackCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'tools', label: 'Tools / automation' },
  { id: 'design', label: 'Design' },
]

// Slugs verified against the installed simple-icons. 'zustand' is not in it, so it uses 'key'.
export const stack: StackItem[] = [
  f('Next.js', 'nextdotjs'),
  f('React', 'react'),
  f('TypeScript', 'typescript'),
  f('Astro', 'astro'),
  f('Tailwind CSS', 'tailwindcss'),
  f('TanStack Query', 'reactquery'),
  f('Axios', 'axios'),
  f('Zustand', 'key'),
  f('Redux', 'redux'),
  b('Node.js', 'nodedotjs'),
  b('Express', 'express'),
  b('Bun', 'bun'),
  b('MongoDB', 'mongodb'),
  b('PostgreSQL', 'postgresql'),
  b('Prisma', 'prisma'),
  b('Drizzle', 'drizzle'),
  b('Socket.io', 'socketdotio'),
  b('OAuth', 'key'),
  b('Clerk', 'clerk'),
  b('JWT', 'jsonwebtokens'),
  b('Auth0', 'auth0'),
  t('n8n', 'n8n'),
  t('Docker', 'docker'),
  t('CLI', 'terminal'),
  t('Git', 'git'),
  t('GitHub', 'github'),
  t('Vercel', 'vercel'),
  d('Figma', 'figma'),
]
