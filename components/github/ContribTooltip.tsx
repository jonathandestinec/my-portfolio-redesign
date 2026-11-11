"use client";

import { useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from "react";

type Tip = { x: number; y: number; text: string };

function describe(el: Element): string {
  const count = Number(el.getAttribute("data-count") ?? 0);
  const date = el.getAttribute("data-date") ?? "";
  const label = new Date(date + "T00:00:00Z").toLocaleDateString("en-US", {
    timeZone: "UTC",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${count} contribution${count === 1 ? "" : "s"} on ${label}`;
}

/**
 * Wraps the server-rendered grid SVG. Hover shows a tooltip via event delegation;
 * the SVG itself is focusable and arrow keys move a highlighted cell.
 */
export function ContribTooltip({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  const active = useRef<Element | null>(null);
  const [tip, setTip] = useState<Tip | null>(null);

  function show(el: Element | null) {
    active.current?.removeAttribute("data-active");
    active.current = el;
    if (!el || !root.current) return setTip(null);
    el.setAttribute("data-active", "");
    const a = el.getBoundingClientRect();
    const r = root.current.getBoundingClientRect();
    setTip({ x: a.left - r.left + a.width / 2, y: a.top - r.top, text: describe(el) });
  }

  function cells() {
    return Array.from(root.current?.querySelectorAll("[data-date]") ?? []);
  }

  function onPointerOver(e: PointerEvent) {
    const el = (e.target as Element).closest?.("[data-date]") ?? null;
    if (el !== active.current) show(el);
  }

  function onKeyDown(e: KeyboardEvent) {
    const step: Record<string, number> = { ArrowUp: -1, ArrowDown: 1, ArrowLeft: -7, ArrowRight: 7 };
    if (!(e.key in step)) {
      if (e.key === "Escape") show(null);
      return;
    }
    const all = cells();
    if (!all.length) return;
    e.preventDefault();
    const cur = active.current ? all.indexOf(active.current) : -1;
    const next = cur < 0 ? all.length - 1 : Math.min(all.length - 1, Math.max(0, cur + step[e.key]));
    show(all[next]);
  }

  return (
    <div
      ref={root}
      className="relative"
      onPointerOver={onPointerOver}
      onPointerLeave={() => show(null)}
      onKeyDown={onKeyDown}
      onBlur={() => show(null)}
    >
      {children}
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
