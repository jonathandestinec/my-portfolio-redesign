import { expect, test } from 'vitest'
import { experience } from '@/content/experience'
import { playground } from '@/content/playground'
import { projects } from '@/content/projects'
import { site } from '@/content/site'
import { stack } from '@/content/stack'
import { rangeLabel, filterStack, getNextProject, getProject, groupPlayground, homeSlides } from '@/lib/content'

test('one featured project → slides tagged by screen', () => {
  const s = homeSlides()
  expect(s.length).toBeGreaterThanOrEqual(3)
  expect(s[0].tag).toBe('AgroHub · Landing')
  expect(s.every((x) => x.href === '/work/agrohub')).toBe(true)
})
test('next project hidden with one project', () => expect(getNextProject('agrohub')).toBeNull())
test('unknown slug', () => expect(getProject('nope')).toBeUndefined())
test('stack filter', () => {
  expect(filterStack(stack, 'all')).toHaveLength(stack.length)
  expect(filterStack(stack, 'tools').map((s) => s.name)).toContain('n8n')
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
    if (icon === 'terminal' || icon === 'key') continue
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

test('the hero note sits on the AgroHub link at the end of its line', () => {
  const last = site.hero.statements.at(-1)!
  const end = last.at(-1)
  expect(typeof end).toBe('object')
  expect(end).toMatchObject({ href: '/work/agrohub', note: 'check this out :)' })
})

test('logo files exist for every logo src', async () => {
  const { existsSync } = await import('node:fs')
  const { education } = await import('@/content/experience')
  for (const e of [...experience, ...education]) {
    if ('src' in e.logo) expect(existsSync(`public${e.logo.src}`)).toBe(true)
  }
})
