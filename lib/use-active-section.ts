"use client";

import { useEffect, useState } from "react";

/** Returns the id of the last listed section crossing the reading band, or null before any has. */
export function useActiveSection(ids: string[]): string | null {
  const [active, setActive] = useState<string | null>(null);
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
        if (current) setActive(current);
      },
      { rootMargin: "-35% 0px -55% 0px" },
    );
    for (const id of list) {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    }
    return () => observer.disconnect();
  }, [key]);

  return active;
}
