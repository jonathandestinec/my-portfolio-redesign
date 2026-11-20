import data from './stack.json'
import type { StackCategory, StackItem } from './types'

export const stackCategories: { id: StackCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'frontend', label: 'Frontend' },
  { id: 'backend', label: 'Backend' },
  { id: 'tools', label: 'Tools' },
  { id: 'design', label: 'Design' },
]

/**
 * Tools and "How I use them" notes. Edited in the admin panel ("Stack"),
 * stored in content/stack.json.
 *
 * `icon` is a simple-icons slug (e.g. "nextdotjs"), or a built-in for brands
 * simple-icons lacks: 'key' (Zustand, OAuth), 'terminal' (CLI), 'card'
 * (Paystack), 'check' (Playwright).
 */
export const stack: StackItem[] = data.items as StackItem[]

export const stackNotes: Record<StackCategory, string> = data.notes

/** Browser-safe (used by the stack filter tabs): keep this file free of server-only imports. */
export function filterStack(items: StackItem[], cat: StackCategory | 'all'): StackItem[] {
  return cat === 'all' ? items : items.filter((i) => i.category === cat)
}
