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
