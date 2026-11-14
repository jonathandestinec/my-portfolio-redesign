"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import {
  externalProps,
  pageLinks,
  resumeLink,
  socialLinks,
} from "./nav-links";
import type { ShellNav } from "./SideNav";

/** Phones and tablets: wordmark + menu button that sit on the page and scroll away (not sticky). */
export function MobileNav({ current, back }: Pick<ShellNav, "current" | "back">) {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const sheet = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const trigger = button.current;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        return;
      }
      if (e.key !== "Tab" || !sheet.current) return;
      // Wrap Tab inside the sheet; with the page inert, focus would otherwise leave the document.
      const items = Array.from(
        sheet.current.querySelectorAll<HTMLElement>(
          "a[href],button:not([disabled])",
        ),
      );
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      const current = document.activeElement;
      if (
        e.shiftKey &&
        (current === first || !sheet.current.contains(current))
      ) {
        e.preventDefault();
        last.focus();
      } else if (
        !e.shiftKey &&
        (current === last || !sheet.current.contains(current))
      ) {
        e.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    sheet.current?.querySelector<HTMLElement>("a,button")?.focus();

    // Make everything behind the sheet inert so focus cannot leave it.
    const inerted: HTMLElement[] = [];
    for (const child of Array.from(document.body.children)) {
      if (
        child instanceof HTMLElement &&
        child !== sheet.current &&
        !child.inert
      ) {
        child.inert = true;
        inerted.push(child);
      }
    }
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    // Leaving the phone layout while open would otherwise lock desktop scrolling.
    const mq = window.matchMedia("(min-width: 1120px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);

    return () => {
      document.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
      for (const el of inerted) el.inert = false;
      document.body.style.overflow = prev;
      // Only focusable once the page is no longer inert; a no-op if the button is hidden.
      trigger?.focus();
    };
  }, [open]);

  const close = () => setOpen(false);

  return (
    <>
      <nav aria-label="Mobile" className="col topbar">
        <Wordmark current={current === "/"} />
        <div className="topbar__tools">
          <ThemeToggle />
          <button
            ref={button}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="button button--pale"
          >
            Menu
          </button>
        </div>
      </nav>
      {open &&
        createPortal(
          <div
            ref={sheet}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            className="sheet"
          >
            <div className="col topbar">
              <Wordmark current={current === "/"} />
              <button type="button" onClick={close} className="button button--pale">
                Close
              </button>
            </div>
            <div className="col flex flex-col gap-10 pb-12 pt-10">
              <ul className="sheet__links">
                {back ? (
                  <li>
                    <Link href={back.href} onClick={close}>
                      {back.label}
                    </Link>
                  </li>
                ) : null}
                <li>
                  <Link href="/" onClick={close} aria-current={current === "/" ? "page" : undefined}>
                    Home
                  </Link>
                </li>
                {pageLinks.map((l) => (
                  <li key={l.href}>
                    <Link
                      href={l.href}
                      onClick={close}
                      aria-current={current === l.href ? "page" : undefined}
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <ul className="flex flex-col gap-2 text-ink-muted">
                <li>
                  <a href={resumeLink.href} download className="text-link">
                    {resumeLink.label}
                  </a>
                </li>
                {socialLinks.map((l) => (
                  <li key={l.href}>
                    <a href={l.href} {...externalProps(l.href)} className="text-link">
                      {l.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
