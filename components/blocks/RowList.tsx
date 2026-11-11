import Link from "next/link";
import type { ReactNode } from "react";
import { isExternal } from "@/components/layout/nav-links";

export type Row = {
  label: string;
  title: string;
  body?: string;
  aside?: ReactNode;
  href?: string;
  tag?: string;
};

function Title({ title, href }: { title: string; href?: string }) {
  if (!href) return <>{title}</>;
  const cls = "hover:underline underline-offset-4";
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {title}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {title}
    </Link>
  );
}

export function RowList({ rows }: { rows: Row[] }) {
  return (
    <ul className="m-0 list-none p-0">
      {rows.map((r) => (
        <li
          key={`${r.label}-${r.title}`}
          className="grid grid-cols-1 gap-1 border-t border-line py-5 md:grid-cols-[140px_1fr] md:gap-6"
        >
          <div className="text-[13px] text-ink-faint">{r.label}</div>
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-2">
                <h3 className="text-[15px] font-medium text-ink">
                  <Title title={r.title} href={r.href} />
                </h3>
                {r.tag && (
                  <span className="text-[11px] uppercase tracking-wide text-ink-faint">
                    {r.tag}
                  </span>
                )}
              </div>
              {r.body && (
                <p className="mt-1 text-[15px] text-ink-muted">{r.body}</p>
              )}
            </div>
            {r.aside && <div className="shrink-0">{r.aside}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
