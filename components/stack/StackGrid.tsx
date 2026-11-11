"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useId, useRef, useState, type KeyboardEvent } from "react";
import { HandNote } from "@/components/hero/HandNote";
import { stackCategories } from "@/content/stack";
import type { StackCategory, StackItem } from "@/content/types";
import { filterStack } from "@/lib/content";
import { StackIcon } from "./StackIcon";

type Cat = StackCategory | "all";

export function StackGrid({ items }: { items: StackItem[] }) {
  const [active, setActive] = useState<Cat>("all");
  const reduce = useReducedMotion();
  const uid = useId();
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const visible = filterStack(items, active);
  const tabId = (id: Cat) => `${uid}-tab-${id}`;
  const panelId = `${uid}-panel`;

  function onKeyDown(e: KeyboardEvent, index: number) {
    const last = stackCategories.length - 1;
    let next = index;
    if (e.key === "ArrowRight") next = index === last ? 0 : index + 1;
    else if (e.key === "ArrowLeft") next = index === 0 ? last : index - 1;
    else if (e.key === "Home") next = 0;
    else if (e.key === "End") next = last;
    else return;
    e.preventDefault();
    setActive(stackCategories[next].id);
    tabRefs.current[next]?.focus();
  }

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="[@media(hover:none)]:hidden">
          <HandNote text="( hover to play )" arrow={false} />
        </div>
        <div
          role="tablist"
          aria-label="Filter stack"
          className="flex flex-wrap gap-1"
        >
          {stackCategories.map((c, i) => {
            const selected = c.id === active;
            return (
              <button
                key={c.id}
                ref={(el) => {
                  tabRefs.current[i] = el;
                }}
                id={tabId(c.id)}
                type="button"
                role="tab"
                aria-selected={selected}
                aria-controls={panelId}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActive(c.id)}
                onKeyDown={(e) => onKeyDown(e, i)}
                className={`rounded-md px-3 py-1.5 text-[15px] transition-colors ${
                  selected
                    ? "bg-paper-raised text-ink"
                    : "text-ink-muted hover:text-ink"
                }`}
              >
                {c.label}
              </button>
            );
          })}
        </div>
      </div>
      <motion.div
        id={panelId}
        role="tabpanel"
        aria-labelledby={tabId(active)}
        tabIndex={0}
        layout={!reduce}
      >
        <ul className="flex flex-wrap gap-2">
          <AnimatePresence initial={false} mode="popLayout">
            {visible.map((s) => (
              <motion.li
                key={s.name}
                layout={!reduce}
                initial={reduce ? false : { opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={
                  reduce
                    ? { opacity: 0, transition: { duration: 0 } }
                    : { opacity: 0, scale: 0.9 }
                }
                transition={{ duration: reduce ? 0 : 0.2 }}
                whileHover={reduce ? undefined : { rotate: [0, -4, 4, 0] }}
                className="flex items-center gap-2 rounded-md border border-line px-3 py-1.5 text-[15px] text-ink-muted"
              >
                <StackIcon slug={s.icon} />
                {s.name}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      </motion.div>
    </div>
  );
}
