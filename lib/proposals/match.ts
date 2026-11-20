/** Ranks past work by how many tags it shares with the proposal; ties keep the given order. */
export type Taggable = { key: string; tags: string[] };

export function rankWork<T extends Taggable>(items: T[], tags: string[]): { item: T; shared: number }[] {
  const wanted = new Set(tags);
  return items
    .map((item, index) => ({ item, index, shared: item.tags.filter((t) => wanted.has(t)).length }))
    .filter((r) => r.shared > 0)
    .sort((a, b) => b.shared - a.shared || a.index - b.index)
    .map(({ item, shared }) => ({ item, shared }));
}
