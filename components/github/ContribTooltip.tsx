"use client";

import {
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from "react";
import { contributionLabel } from "@/lib/github";

type Tip = { x: number; y: number; text: string };

function describe(el: Element): string {
  return contributionLabel(Number(el.getAttribute("data-count") ?? 0), el.getAttribute("data-date") ?? "");
}

const num = (el: Element, k: string) => Number(el.getAttribute(k));

/**
 * Wraps the server-rendered grid SVG in an inner horizontal scroller. Hover shows a tooltip via
 * event delegation; the SVG is focusable and arrow keys move a highlighted cell by (col,row).
 */
export function ContribTooltip({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const active = useRef<Element | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, []);

  function show(el: Element | null, reveal = false) {
    active.current?.removeAttribute("data-active");
    active.current = el;
    if (!el || !root.current) return setTip(null);
    el.setAttribute("data-active", "");
    if (reveal && "scrollIntoView" in el) {
      (el as unknown as HTMLElement).scrollIntoView({ block: "nearest", inline: "nearest" });
    }
    const a = el.getBoundingClientRect();
    const r = root.current.getBoundingClientRect();
    const text = describe(el);
    const half = text.length * 3.6 + 10; // estimated half-width of the tooltip
    const x = Math.min(Math.max(a.left - r.left + a.width / 2, half), Math.max(half, r.width - half));
    setTip({ x, y: a.top - r.top, text });
  }

  function cells() {
    return Array.from(root.current?.querySelectorAll("[data-date]") ?? []);
  }

  function onPointerOver(e: PointerEvent) {
    const el = (e.target as Element).closest?.("[data-date]") ?? null;
    if (el !== active.current) show(el);
  }

  function onFocus(e: FocusEvent) {
    if (e.target !== e.currentTarget.querySelector("svg")) return;
    let visible = true;
    try {
      visible = e.target.matches(":focus-visible");
    } catch {}
    if (!visible || active.current) return;
    const all = cells();
    if (all.length) show(all[all.length - 1], true);
  }

  function onKeyDown(e: KeyboardEvent) {
    if (e.key === "Escape") return show(null);
    const dCol = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    const dRow = e.key === "ArrowDown" ? 1 : e.key === "ArrowUp" ? -1 : 0;
    if (!dCol && !dRow) return;
    e.preventDefault();
    const all = cells();
    if (!all.length) return;
    const cur = active.current ?? all[all.length - 1];
    if (!active.current) return show(cur, true);
    const key = (c: number, r: number) => `${c},${r}`;
    const map = new Map(all.map((el) => [key(num(el, "data-col"), num(el, "data-row")), el]));
    let c = num(cur, "data-col");
    let r = num(cur, "data-row");
    // Step in one direction, skipping holes; clamp (no wrapping across weeks).
    for (;;) {
      c += dCol;
      r += dRow;
      if (c < 0 || r < 0 || r > 6) return;
      const hit = map.get(key(c, r));
      if (hit) return show(hit, true);
      if (c > 200) return;
    }
  }

  return (
    <div
      ref={root}
      className="relative"
      onPointerOver={onPointerOver}
      onPointerLeave={() => show(null)}
      onKeyDown={onKeyDown}
      onFocus={onFocus}
      onBlur={() => show(null)}
    >
      <div ref={scroller} className="overflow-x-auto">
        {children}
      </div>
      <span className="sr-only" role="status">
        {tip?.text}
      </span>
      {tip ? (
        <div
          aria-hidden
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full whitespace-nowrap rounded bg-ink px-2 py-1 text-[12px] text-paper"
          style={{ left: tip.x, top: tip.y - 6 }}
        >
          {tip.text}
        </div>
      ) : null}
    </div>
  );
}
