"use client";

import Link from "next/link";
import { useVisibleSections } from "@/lib/use-active-section";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import {
  externalProps,
  pageLinks,
  resumeLink,
  socialLinks,
  type NavLink,
} from "./nav-links";
import { useNavHidden } from "./nav-visibility";

export type ShellNav = {
  /** href of the page being shown, e.g. "/experience" ("/" on home). */
  current?: string;
  /** Detail pages show a back link in place of the page list. */
  back?: NavLink;
  /** In-page anchors (case studies, writing years). */
  sections?: NavLink[];
};

export function SideNav({ current, back, sections = [] }: ShellNav) {
  const hidden = useNavHidden();
  // Only in-page anchors (case-study chapters, writing years) light up while on screen;
  // the page links open separate pages, so they only mark the current page.
  const visible = useVisibleSections(sections.map((s) => s.href.slice(1)));

  return (
    <nav
      aria-label="Primary"
      inert={hidden}
      className={`sidebar${hidden ? " is-hidden" : ""}`}
    >
      {back ? (
        <ul className="sidebar__group">
          <li>
            <Link href={back.href} className="sidebar__link whitespace-nowrap">
              {back.label}
            </Link>
          </li>
        </ul>
      ) : (
        <div>
          <Wordmark side current={current === "/"} />
        </div>
      )}

      {sections.length > 0 ? (
        <ul className="sidebar__group">
          {sections.map((s) => (
            <li key={s.href}>
              <a
                href={s.href}
                data-in-view={visible.has(s.href.slice(1)) ? "" : undefined}
                className="sidebar__link"
              >
                {s.label}
              </a>
            </li>
          ))}
        </ul>
      ) : null}

      <ul className="sidebar__group">
        {pageLinks.map((l) => (
          <li key={l.href}>
            <Link
              href={l.href}
              aria-current={current === l.href ? "page" : undefined}
              className="sidebar__link"
            >
              {l.label}
            </Link>
          </li>
        ))}
      </ul>

      <ul className="sidebar__group">
        <li>
          <a href={resumeLink.href} download className="sidebar__link">
            {resumeLink.label}
          </a>
        </li>
      </ul>

      <ul className="sidebar__group">
        {socialLinks.map((l) => (
          <li key={l.href}>
            <a href={l.href} {...externalProps(l.href)} className="sidebar__link">
              {l.label}
            </a>
          </li>
        ))}
      </ul>

      <div>
        <ThemeToggle />
      </div>
    </nav>
  );
}
