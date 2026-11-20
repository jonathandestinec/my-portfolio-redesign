import Link from "next/link";
import type { ReactNode } from "react";
import { HideNavZone } from "@/components/layout/nav-visibility";

type SectionProps = {
  id: string;
  title: string;
  /** Grey line under the title. */
  sub?: string;
  /** "More …→" link to the section's own page. */
  more?: { href: string; label: string };
  /** Small grey label (reference "Testimonials", "FAQ") instead of a medium title. */
  label?: boolean;
  children: ReactNode;
};

export function Section({ id, title, sub, more, label, children }: SectionProps) {
  const titleId = `${id}-title`;
  return (
    <section id={id} aria-labelledby={titleId} className="col section">
      <div className="section__head" data-reveal>
        <h2 id={titleId} className={`section__title${label ? " section__title--label" : ""}`}>
          {title}
        </h2>
        {sub ? <p className="section__sub">{sub}</p> : null}
      </div>
      <div data-reveal>{children}</div>
      {more ? (
        <p className="section__more" data-reveal>
          <Link href={more.href} className="text-link">
            {more.label} →
          </Link>
        </p>
      ) : null}
    </section>
  );
}

/** Full-bleed block (the work strip); hides the sidebar while it fills the screen. */
export function Bleed({ id, label, children }: { id?: string; label: string; children: ReactNode }) {
  return (
    <section id={id} aria-label={label} data-reveal>
      <HideNavZone>{children}</HideNavZone>
    </section>
  );
}
