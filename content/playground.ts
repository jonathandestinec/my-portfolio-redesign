import data from './playground.json'
import type { PlaygroundItem } from './types'

const opt = (s: string | null | undefined) => (s ? s : undefined)

/** Client work and experiments on /works. Edited in the admin panel ("Client work & experiments"), stored in content/playground.json. */
export const playground: PlaygroundItem[] = data.items.map((i) => ({
  name: i.name,
  group: i.group as PlaygroundItem['group'],
  role: i.role,
  summary: i.summary,
  stack: i.stack.length ? i.stack : undefined,
  url: opt(i.url),
  repo: opt(i.repo),
}))
