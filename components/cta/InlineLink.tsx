import Link from "next/link";
import type { ReactNode } from "react";
import { isExternal } from "@/components/layout/nav-links";

const cls =
  "underline decoration-dotted decoration-1 underline-offset-[0.18em] decoration-ink-faint hover:decoration-ink";

export function InlineLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  if (isExternal(href)) {
    return (
      <a href={href} target="_blank" rel="noreferrer" className={cls}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={cls}>
      {children}
    </Link>
  );
}
