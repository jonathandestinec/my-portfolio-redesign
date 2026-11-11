import type { ReactNode } from "react";

export function MetaTable({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="m-0">
      {rows.map(([k, v]) => (
        <div
          key={k}
          className="grid grid-cols-[110px_1fr] gap-4 border-t border-line py-3 first:border-t-0 md:grid-cols-[140px_1fr]"
        >
          <dt className="text-[13px] text-ink-faint">{k}</dt>
          <dd className="m-0 min-w-0 text-[15px] text-ink">{v}</dd>
        </div>
      ))}
    </dl>
  );
}
