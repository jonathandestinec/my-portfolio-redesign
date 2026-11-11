"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { site } from "@/content/site";

const chipCls =
  "inline-block rounded-full border border-line px-3.5 py-1.5 text-[14px] text-ink hover:bg-paper-raised";

export function CtaGroup() {
  const [open, setOpen] = useState(false);
  const reduce = useReducedMotion();
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pointerType = useRef("");

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = null;
  };
  useEffect(() => clear, []);

  const show = () => {
    clear();
    setOpen(true);
  };
  const hideSoon = () => {
    clear();
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  const chips = [
    { label: "Email", href: `mailto:${site.email}`, download: false },
    { label: "Résumé ↓", href: "/resume.pdf", download: true },
  ];

  return (
    <div
      className="flex flex-wrap items-center gap-2"
      onPointerEnter={(e) => {
        if (e.pointerType !== "touch") show();
      }}
      onPointerLeave={(e) => {
        if (e.pointerType !== "touch") hideSoon();
      }}
      onFocus={show}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
          clear();
          setOpen(false);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === "Escape") {
          clear();
          setOpen(false);
        }
      }}
    >
      <a
        href={site.calendarUrl}
        target="_blank"
        rel="noreferrer"
        aria-expanded={open}
        aria-controls="cta-more"
        onPointerDown={(e) => {
          pointerType.current = e.pointerType;
        }}
        onClick={(e) => {
          if (pointerType.current === "touch" && !open) {
            e.preventDefault();
            show();
          }
          pointerType.current = "";
        }}
        className="rounded-full bg-pill px-5 py-2.5 text-[15px] font-medium text-pill-ink"
      >
        Book a call
      </a>
      <span id="cta-more" className="flex items-center gap-2">
        <AnimatePresence>
          {open
            ? chips.map((c, i) => (
                <motion.a
                  key={c.label}
                  href={c.href}
                  download={c.download ? "" : undefined}
                  className={chipCls}
                  initial={reduce ? false : { opacity: 0, x: -6 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={
                    reduce
                      ? { opacity: 0, transition: { duration: 0 } }
                      : { opacity: 0, x: -6, transition: { duration: 0.1 } }
                  }
                  transition={{ duration: 0.2, delay: reduce ? 0 : i * 0.05 }}
                >
                  {c.label}
                </motion.a>
              ))
            : null}
        </AnimatePresence>
      </span>
    </div>
  );
}
