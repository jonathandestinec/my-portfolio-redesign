import Link from "next/link";
import type { ReactNode } from "react";
import { Actions } from "@/components/cta/Actions";
import { Reveal } from "@/components/motion/Reveal";
import { MobileNav } from "./MobileNav";
import { SideNav, type ShellNav } from "./SideNav";

type Props = ShellNav & {
  children: ReactNode;
  /** Closing line above the footer; pass null to drop it. */
  closing?: string | null;
};

export function SiteShell({
  current,
  back,
  sections,
  closing = "Have a role in mind? Let's talk.",
  children,
}: Props) {
  return (
    <>
      <SideNav current={current} back={back} sections={sections} />
      <MobileNav current={current} back={back} />
      <main id="content">
        {children}
        {closing ? (
          <section className="col closing" aria-label="Get in touch" data-reveal>
            <p className="closing__statement">{closing}</p>
            <Actions />
          </section>
        ) : null}
      </main>
      <footer className="col footer" data-reveal>
        <div className="footer__legal">
          <span>© 2026 Destine Jonathan</span>
          <div className="footer__links">
            <Link href="/works">Works</Link>
            <Link href="/blog">Writing</Link>
            <a href="/blog/rss.xml">RSS</a>
          </div>
        </div>
      </footer>
      <Reveal />
    </>
  );
}
