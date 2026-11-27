"use client";

import { useEffect, useRef, useState } from "react";

/**
 * A project film: muted, looping, inline. It only plays while it is on screen
 * (and, in the carousel, while its slide is current). With reduced motion, or
 * without JavaScript, it stays on its poster frame.
 */
export function FilmLoop({
  src,
  poster,
  label,
  active = true,
  className,
}: {
  src: string;
  poster: string;
  label: string;
  active?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [visible, setVisible] = useState(false);
  const [reduce, setReduce] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduce(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { threshold: 0.35 });
    io.observe(v);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && visible && !reduce) {
      v.play().catch(() => undefined);
    } else {
      v.pause();
      if (reduce) v.currentTime = 0;
    }
  }, [active, visible, reduce]);

  return (
    <video
      ref={ref}
      className={className}
      src={src}
      poster={poster}
      muted
      loop
      playsInline
      preload="metadata"
      aria-label={label}
      data-film
      disablePictureInPicture
    />
  );
}
