"use client";

import { useEffect } from "react";

const SELECTOR = "[data-reveal], [data-reveal-children] > *";
const BOTTOM_MARGIN = 48;
const STAGGER = 70;
const MAX_DELAY = 350;

/**
 * One-time blur-in, as on the reference: anything that starts below the fold
 * is blurred and transparent, then sharpens into place once it scrolls in and
 * stays sharp. Things already on screen at load are never touched, and without
 * JS (or with reduced motion) nothing is hidden at all.
 */
export function Reveal() {
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) return;

    const fold = window.innerHeight;
    const targets = Array.from(document.querySelectorAll<HTMLElement>(SELECTOR)).filter(
      (el) => el.getBoundingClientRect().top > fold,
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries
          .filter((e) => e.isIntersecting)
          .forEach((e, i) => {
            const el = e.target as HTMLElement;
            observer.unobserve(el);
            el.style.setProperty("--reveal-delay", `${Math.min(i * STAGGER, MAX_DELAY)}ms`);
            el.classList.add("is-in");
          });
      },
      { rootMargin: `0px 0px -${BOTTOM_MARGIN}px 0px` },
    );

    const cleanups: (() => void)[] = [];
    for (const el of targets) {
      el.classList.add("reveal");
      const done = (ev: TransitionEvent) => {
        if (ev.target !== el || ev.propertyName !== "filter") return;
        el.removeEventListener("transitionend", done);
        el.classList.remove("reveal", "is-in");
        el.style.removeProperty("--reveal-delay");
      };
      el.addEventListener("transitionend", done);
      cleanups.push(() => {
        el.removeEventListener("transitionend", done);
        el.classList.remove("reveal", "is-in");
        el.style.removeProperty("--reveal-delay");
      });
      observer.observe(el);
    }

    return () => {
      observer.disconnect();
      cleanups.forEach((c) => c());
    };
  }, []);

  return null;
}
