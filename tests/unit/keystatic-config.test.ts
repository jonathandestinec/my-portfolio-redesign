// @vitest-environment node
import fs from 'node:fs'
import { expect, test } from 'vitest'
import config from '../../keystatic.config'

test('every admin singleton edits a content file the site reads', () => {
  for (const [name, s] of Object.entries(config.singletons ?? {})) {
    expect(fs.existsSync(`${s.path}.json`), `${name}: ${s.path}.json`).toBe(true)
  }
})

test('admin collections point at the folders the site reads', () => {
  const c = config.collections ?? {}
  expect(c.projects.path).toBe('content/projects/*')
  expect(c.posts.path).toBe('content/blog/*')
  expect(fs.readdirSync('content/projects').some((f) => f.endsWith('.json'))).toBe(true)
  expect(fs.readdirSync('content/blog').some((f) => f.endsWith('.mdx'))).toBe(true)
})

test('production saves go to this repo on GitHub', () => {
  // NODE_ENV is "test" here, so the config picks GitHub storage as in production.
  expect(config.storage).toMatchObject({ kind: 'github', repo: { owner: 'jonathandestinec', name: 'my-portfolio-redesign' } })
})
