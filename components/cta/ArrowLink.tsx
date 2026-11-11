import Link from "next/link";
import type { ReactNode } from "react";

const cls =
  "text-[15px] text-ink-muted underline decoration-line decoration-1 underline-offset-4 hover:text-ink hover:decoration-ink";

export function ArrowLink({
  href,
  external,
  children,
}: {
  href: string;
  external?: boolean;
  children: ReactNode;
}) {
  const arrow = external ? " ↗" : " →";
  if (external) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
        {arrow}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
      {arrow}
    </Link>
  );
}
