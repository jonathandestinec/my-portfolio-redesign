"use client";

import { useEffect, useState } from "react";

/** Returns the id of the last listed section crossing the reading band, or null before any has. */
export function useActiveSection(ids: string[]): string | null {
  const [state, setState] = useState<{ key: string; id: string | null }>({
    key: "",
    id: null,
  });
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        const current = list.filter((id) => seen.has(id)).pop();
        setState({ key, id: current ?? null });
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  // Ignore a result recorded for a previous id list.
  return state.key === key ? state.id : null;
}

/**
 * Ids of every listed section currently on screen (any part of it inside the
 * viewport, ignoring a thin band at the top and bottom edges).
 */
export function useVisibleSections(ids: string[]): Set<string> {
  const [state, setState] = useState<{ key: string; ids: Set<string> }>({
    key: "",
    ids: new Set(),
  });
  const key = ids.join("|");

  useEffect(() => {
    const list = key ? key.split("|") : [];
    const seen = new Set<string>();
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) seen.add(entry.target.id);
          else seen.delete(entry.target.id);
        }
        setState({ key, ids: new Set(seen) });
      },
      { rootMargin: "-8% 0px -8% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return state.key === key ? state.ids : new Set();
}
