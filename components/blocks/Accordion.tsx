import type { ReactNode } from "react";

export function Accordion({ items }: { items: { q: string; a: ReactNode }[] }) {
  return (
    <div>
      {items.map((it) => (
        <details key={it.q} className="group border-t border-line last:border-b">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-[15px] text-ink [&::-webkit-details-marker]:hidden">
            {it.q}
            <span
              aria-hidden="true"
              className="shrink-0 text-ink-faint transition-transform duration-200 motion-reduce:transition-none group-open:rotate-45"
            >
              +
            </span>
          </summary>
          <div className="pb-4 text-[15px] leading-relaxed text-ink-muted">
            {it.a}
          </div>
        </details>
      ))}
    </div>
  );
}
