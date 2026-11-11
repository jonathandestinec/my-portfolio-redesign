"use client";

import {
  motion,
  useReducedMotion,
  useScroll,
  useTransform,
} from "motion/react";
import { type ReactNode, useRef, useSyncExternalStore } from "react";

const subscribe = () => () => {};

export function ScrollBlur({
  children,
  className,
}: {
  children: ReactNode;
  as?: "div";
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  // Server HTML and no-JS render plain children; blur/opacity only apply after mount.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const blur = useTransform(scrollYProgress, [0, 0.25, 0.75, 1], [8, 0, 0, 8]);
  const filter = useTransform(blur, (v) => `blur(${v}px)`);
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.25, 0.75, 1],
    [0.4, 1, 1, 0.4],
  );

  if (!mounted || reduce) {
    return (
      <div ref={ref} className={className}>
        {children}
      </div>
    );
  }
  return (
    <motion.div ref={ref} className={className} style={{ filter, opacity }}>
      {children}
    </motion.div>
  );
}
