"use client";

import { motion, useReducedMotion } from "motion/react";

// Curved arrow, drawn in a 48x32 box. "up-left" tip at top-left; "left" tip at mid-left.
const paths = {
  "up-left": {
    d: "M44 26 C 30 30, 14 24, 6 6 M6 6 L4 16 M6 6 L15 10",
    flip: false,
  },
  left: {
    d: "M44 20 C 30 26, 16 22, 5 14 M5 14 L14 12 M5 14 L12 22",
    flip: false,
  },
} as const;

export function HandNote({
  text,
  arrow = "up-left",
}: {
  text: string;
  arrow?: "up-left" | "left";
}) {
  const reduce = useReducedMotion();
  const p = paths[arrow];
  return (
    <div className="flex -rotate-[4deg] items-center gap-1 font-hand text-[20px] leading-none text-ink-muted">
      <svg
        width="48"
        height="32"
        viewBox="0 0 48 32"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <motion.path
          d={p.d}
          stroke="currentColor"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={reduce ? false : { pathLength: 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={{ once: true, amount: 0.8 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
        />
      </svg>
      <span>{text}</span>
    </div>
  );
}
