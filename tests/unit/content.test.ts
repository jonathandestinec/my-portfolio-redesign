import { expect, test } from 'vitest'
import { experience } from '@/content/experience'
import { playground } from '@/content/playground'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { stack } from '@/content/stack'
import { rangeLabel, filterStack, getNextProject, getProject, groupPlayground, hasCustomDomain, heroStatements, homeSlides } from '@/lib/content'

test('carousel shows one cover per project, Huddle first', () => {
  const s = homeSlides()
  expect(s.map((x) => x.tag)).toEqual(projects.map((p) => p.name))
  expect(s[0]).toMatchObject({ tag: 'Huddle', href: '/work/huddle', image: projects[0].cover })
  expect(s[1]).toMatchObject({ tag: 'AgroHub', href: '/work/agrohub' })
})
test('next project wraps around', () => {
  expect(getNextProject('huddle')?.slug).toBe('agrohub')
  expect(getNextProject('agrohub')?.slug).toBe('huddle')
})
test('every project image file exists', async () => {
  const { existsSync } = await import('node:fs')
  for (const p of projects) {
    const srcs = [p.cover.src, ...p.slides.map((x) => x.src), ...p.images.map((x) => x.src), ...p.chapters.flatMap((c) => c.images.map((x) => x.src))]
    for (const src of srcs) expect(existsSync(`public${src}`), src).toBe(true)
  }
})
test('unknown slug', () => expect(getProject('nope')).toBeUndefined())
test('stack filter', () => {
  expect(filterStack(stack, 'all')).toHaveLength(stack.length)
  expect(filterStack(stack, 'tools').map((s) => s.name)).toContain('n8n')
})
test('client work on custom domains comes before *.vercel.app sites, order kept within each', () => {
  const { client } = groupPlayground(playground)
  const flags = client.map(hasCustomDomain)
  const firstVercel = flags.indexOf(false)
  expect(firstVercel).toBeGreaterThan(0)
  expect(flags.slice(firstVercel).every((f) => !f)).toBe(true)
  const original = playground.filter((i) => i.group === 'client')
  const inOriginalOrder = (xs: typeof client) =>
    xs.every((x, i) => i === 0 || original.indexOf(xs[i - 1]) < original.indexOf(x))
  expect(inOriginalOrder(client.filter(hasCustomDomain))).toBe(true)
  expect(inOriginalOrder(client.filter((x) => !hasCustomDomain(x)))).toBe(true)
})
test('playground groups', () => {
  const g = groupPlayground(playground)
  expect(g.client.map((i) => i.name)).toContain('Thymus Energy FZCO')
  expect(g.experiment.map((i) => i.name)).toContain('RefillRx')
})
test('no phone numbers in content', () =>
  expect(JSON.stringify({ site, projects, experience, playground })).not.toMatch(/\+?234\d{6,}/))
test('every stack icon is a real simple-icons slug or a built-in', async () => {
  const si = (await import('simple-icons')) as Record<string, unknown>
  for (const { icon } of stack) {
    if (['terminal', 'key', 'card', 'check'].includes(icon)) continue
    const key = 'si' + icon[0].toUpperCase() + icon.slice(1)
    expect(Object.keys(si).map((k) => k.toLowerCase())).toContain(key.toLowerCase())
  }
})

test('rangeLabel collapses identical start and end', () => {
  expect(rangeLabel('2025', '2025')).toBe('2025')
  expect(rangeLabel('Aug 2024', 'Present')).toBe('Aug 2024 – Present')
})

test('every role and course has a unique slug, a logo and drafted details', async () => {
  const { education } = await import('@/content/experience')
  const all = [...experience, ...education]
  expect(new Set(all.map((e) => e.slug)).size).toBe(all.length)
  for (const e of all) {
    expect(e.logo).toBeTruthy()
    expect(e.details.length).toBeGreaterThan(40)
    expect(e.highlights.length).toBeGreaterThan(0)
  }
})

test('hero names and links the two newest projects, then points at all work', () => {
  const [intro, lately, more] = heroStatements()
  expect(intro).toEqual([site.hero.intro])
  const links = lately.filter((x) => typeof x === 'object')
  expect(links).toEqual([
    { text: 'Huddle', href: '/work/huddle' },
    { text: 'AgroHub', href: '/work/agrohub' },
  ])
  expect(lately.join('')).not.toContain('undefined')
  expect(more.at(-1)).toMatchObject({ href: '/works', note: 'check this out :)' })
  for (const p of projects) expect(p.blurb.length).toBeGreaterThan(10)
})

test('logo files exist for every logo src', async () => {
  const { existsSync } = await import('node:fs')
  const { education } = await import('@/content/experience')
  for (const e of [...experience, ...education]) {
    if ('src' in e.logo) expect(existsSync(`public${e.logo.src}`)).toBe(true)
  }
})
