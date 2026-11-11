"use client";

import { motion, useReducedMotion } from "motion/react";
import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

// Curved arrow in a 48x32 box. "up-left" tip at top-left; "left" tip at mid-left.
const paths = {
  "up-left": "M44 26 C 30 30, 14 24, 6 6 M6 6 L4 16 M6 6 L15 10",
  left: "M44 20 C 30 26, 16 22, 5 14 M5 14 L14 12 M5 14 L12 22",
} as const;

export function HandNote({
  text,
  arrow = "up-left",
}: {
  text: string;
  arrow?: "up-left" | "left" | false;
}) {
  const reduce = useReducedMotion();
  // Server HTML (and no-JS) shows the arrow fully drawn; the draw-in only starts after mount.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const animate = mounted && !reduce;
  return (
    <div className="flex -rotate-[4deg] items-center gap-1 font-hand text-[20px] leading-none text-ink-muted">
      {arrow ? (
        <svg
          width="48"
          height="32"
          viewBox="0 0 48 32"
          fill="none"
          aria-hidden="true"
          className="shrink-0"
        >
          <motion.path
            d={paths[arrow]}
            stroke="currentColor"
            strokeWidth={1.5}
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={false}
            animate={animate ? undefined : { pathLength: 1 }}
            whileInView={animate ? { pathLength: 1 } : undefined}
            viewport={{ once: true, amount: 0.8 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            {...(animate ? { style: { pathLength: 0 } } : {})}
          />
        </svg>
      ) : null}
      <span>{text}</span>
    </div>
  );
}
