import type { ReactNode } from "react";
import { HideNavZone } from "@/components/layout/nav-visibility";

type SectionProps = { id: string; title?: string; hideNav?: boolean; children: ReactNode };

export function Section({ id, title, hideNav, children }: SectionProps) {
  const titleId = title ? `${id}-title` : undefined;
  return (
    <section id={id} aria-labelledby={titleId} className="scroll-mt-16 py-12 md:py-20">
      {title ? (
        <h2 id={titleId} className="mb-6 text-[13px] font-normal text-ink-faint">
          {title}
        </h2>
      ) : null}
      {hideNav ? <HideNavZone>{children}</HideNavZone> : children}
    </section>
  );
}
