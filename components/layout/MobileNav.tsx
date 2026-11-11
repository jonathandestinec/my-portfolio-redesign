"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
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
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        button.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    sheet.current?.querySelector<HTMLElement>("a,button")?.focus();
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    button.current?.focus();
  };
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
      {open && (
        <div
          ref={sheet}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
          className="fixed inset-0 z-50 flex h-svh flex-col bg-paper px-4 py-4"
        >
          <div className="flex justify-end">
            <button type="button" onClick={close} className="rounded-full border border-line px-4 py-2 text-[15px] text-ink">
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
                <Link href={l.href} onClick={() => setOpen(false)} className={item}>
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
                  {...(isExternal(l.href) ? { target: "_blank", rel: "noreferrer" } : {})}
                  className="text-lg text-ink-muted"
                >
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
