"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { isExternal, socialLinks, type NavLink } from "./nav-links";

type Props = { links?: NavLink[]; back?: NavLink };

export function MobileNav({ links = [], back }: Props) {
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
    const mq = window.matchMedia("(min-width: 768px)");
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
  const item = "text-2xl text-ink";

  return (
    <div className="sticky top-0 z-40 md:hidden">
      <nav
        aria-label="Mobile"
        className="flex items-center justify-between bg-paper px-4 py-3"
      >
        <Wordmark size="sm" />
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            ref={button}
            type="button"
            aria-haspopup="dialog"
            aria-expanded={open}
            onClick={() => setOpen(true)}
            className="rounded-full bg-pill px-4 py-2 text-[15px] text-pill-ink"
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
            className="fixed inset-0 z-50 flex h-svh flex-col bg-paper px-4 py-4"
          >
            <div className="flex justify-end">
              <button
                type="button"
                onClick={close}
                className="rounded-full border border-line px-4 py-2 text-[15px] text-ink"
              >
                Close
              </button>
            </div>
            <ul className="mt-8 flex flex-col gap-4">
              {back && (
                <li>
                  <Link href={back.href} onClick={close} className={item}>
                    ← {back.label}
                  </Link>
                </li>
              )}
              {links.map((l) => (
                <li key={l.href}>
                  <Link href={l.href} onClick={close} className={item}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
            <ul className="mt-10 flex flex-col gap-3">
              {socialLinks.map((l) => (
                <li key={l.label}>
                  <a
                    href={l.href}
                    download={l.download ? "" : undefined}
                    {...(isExternal(l.href)
                      ? { target: "_blank", rel: "noreferrer" }
                      : {})}
                    className="text-lg text-ink-muted"
                  >
                    {l.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>,
          document.body,
        )}
    </div>
  );
}
