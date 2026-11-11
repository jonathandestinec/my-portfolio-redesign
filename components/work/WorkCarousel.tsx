"use client";

import Image from "next/image";
import Link from "next/link";
import {
  animate,
  motion,
  useMotionValue,
  useReducedMotion,
  type PanInfo,
} from "motion/react";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import type { Img } from "@/content/types";

type Slide = { image: Img; tag: string; href: string };

const GAP = 24;
const DRAG_CLICK_THRESHOLD = 6;
const SPRING = { type: "spring", stiffness: 300, damping: 35 } as const;

const subscribe = () => () => {};

export function WorkCarousel({ slides }: { slides: Slide[] }) {
  const reduce = useReducedMotion();
  // Server HTML and no-JS render un-bled, undimmed; those apply only after mount.
  const mounted = useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const firstCardRef = useRef<HTMLDivElement>(null);
  const [bleed, setBleed] = useState<{ left: number; width: number } | null>(null);
  const [step, setStep] = useState(0);
  const [index, setIndex] = useState(0);
  const indexRef = useRef(0);
  const x = useMotionValue(0);
  const dragged = useRef(false);

  // Full bleed: the column is not centred in the viewport, so measure how far
  // its left edge is from the viewport edge and pull the carousel back by that.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // clientWidth excludes a classic scrollbar, unlike 100vw.
    const measure = () => {
      const left = el.getBoundingClientRect().left;
      const width = document.documentElement.clientWidth;
      setBleed((b) => (b && b.left === left && b.width === width ? b : { left, width }));
    };
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    ro.observe(document.documentElement);
    window.addEventListener("resize", measure);
    let live = true;
    document.fonts?.ready.then(() => live && measure());
    return () => {
      live = false;
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  // Card pitch (width + gap) follows the CSS width, so observe a real card.
  useEffect(() => {
    const el = firstCardRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setStep(el.offsetWidth + GAP));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Keep the active card centred when the pitch changes (resize).
  useEffect(() => {
    if (step) x.jump(-indexRef.current * step);
  }, [step, x]);

  const goTo = useCallback(
    (i: number) => {
      if (!Number.isFinite(i)) return;
      const next = Math.max(0, Math.min(slides.length - 1, i));
      indexRef.current = next;
      setIndex(next);
      if (!step) return;
      animate(x, -next * step, reduce ? { duration: 0 } : SPRING);
    },
    [slides.length, step, x, reduce],
  );

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (!step) return;
    // Let a flick nudge the target a little (at most 0.3 of a card), and never
    // skip more than one card per gesture.
    const v = Number.isFinite(info.velocity.x) ? info.velocity.x : 0;
    const nudge = reduce ? 0 : Math.max(-0.3 * step, Math.min(0.3 * step, v * 0.15));
    const target = Math.round(-(x.get() + nudge) / step);
    const from = indexRef.current;
    goTo(Math.max(from - 1, Math.min(from + 1, target)));
  };

  // onDragEnd is deferred by Motion until after the browser's click, so the
  // "was this a drag?" flag has to be set while the pointer is still moving.
  const onDrag = (_: unknown, info: PanInfo) => {
    if (Math.abs(info.offset.x) > DRAG_CLICK_THRESHOLD) dragged.current = true;
  };

  const onClickCapture = (e: MouseEvent) => {
    if (dragged.current) {
      e.preventDefault();
      e.stopPropagation();
      dragged.current = false;
    }
  };

  const onKeyDown = (e: KeyboardEvent) => {
    dragged.current = false;
    if (e.key === "ArrowRight") {
      e.preventDefault();
      goTo(indexRef.current + 1);
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      goTo(indexRef.current - 1);
    }
  };

  const maxDrag = Math.max(0, (slides.length - 1) * step);

  return (
    <div ref={containerRef}>
      <div
        role="region"
        aria-roledescription="carousel"
        aria-label="AgroHub screens"
        tabIndex={0}
        onKeyDown={onKeyDown}
        className="rounded-2xl focus-visible:outline-offset-4"
        style={mounted && bleed ? { marginLeft: -bleed.left, width: bleed.width } : undefined}
      >
        <div data-bleed className="overflow-x-clip py-1">
          <motion.div
            drag="x"
            dragConstraints={{ left: -maxDrag, right: 0 }}
            dragElastic={0.1}
            dragMomentum={false}
            onPointerDown={() => {
              dragged.current = false;
            }}
            onDrag={onDrag}
            onDragEnd={onDragEnd}
            onClickCapture={onClickCapture}
            style={{
              x,
              gap: GAP,
              paddingInline: "calc((100% - min(70vw, 1100px)) / 2)",
            }}
            className="flex"
          >
            {slides.map((slide, i) => {
              const active = i === index;
              return (
                <div
                  key={slide.href + slide.tag}
                  aria-current={active ? "true" : undefined}
                  className={`shrink-0 transition-opacity duration-300 motion-reduce:transition-none ${
                    mounted && !active ? "opacity-60" : ""
                  }`}
                >
                  <Link
                    href={slide.href}
                    draggable={false}
                    aria-label={slide.tag}
                    onFocus={(e) => {
                      // Keyboard focus only: pointer focus fires on mousedown and
                      // would activate the card before the click, or fight a drag.
                      if (e.currentTarget.matches(":focus-visible")) goTo(i);
                    }}
                    onClick={(e) => {
                      // A peeking neighbour brings itself into view before it navigates.
                      if (!active) {
                        e.preventDefault();
                        goTo(i);
                      }
                    }}
                    className="block"
                  >
                    <div
                      ref={i === 0 ? firstCardRef : undefined}
                      className={`relative aspect-[16/10] w-[min(70vw,1100px)] overflow-hidden rounded-2xl border border-line bg-paper-raised ${
                        active ? "outline outline-1 outline-accent outline-offset-0" : ""
                      }`}
                    >
                      <Image
                        src={slide.image.src}
                        alt={slide.image.alt}
                        fill
                        sizes="70vw"
                        preload={i === 0}
                        draggable={false}
                        className="object-cover object-top"
                        onError={(e) => {
                          // Missing file: leave the calm paper well, not a broken icon.
                          e.currentTarget.style.opacity = "0";
                        }}
                      />
                    </div>
                  </Link>
                  <div className="mt-2 h-5">
                    {active ? (
                      <span className="inline-block rounded bg-accent px-1.5 py-0.5 text-[11px] leading-none text-paper">
                        {slide.tag}
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </motion.div>
        </div>

        <div className="mt-3 flex justify-end gap-2 pr-4 md:pr-8">
          <button
            type="button"
            aria-label="Previous slide"
            disabled={index === 0}
            onClick={() => goTo(index - 1)}
            className="h-9 w-9 rounded-full border border-line text-ink transition-colors motion-reduce:transition-none hover:bg-paper-raised disabled:cursor-default disabled:text-ink-faint disabled:hover:bg-transparent"
          >
            <span aria-hidden="true">←</span>
          </button>
          <button
            type="button"
            aria-label="Next slide"
            disabled={index === slides.length - 1}
            onClick={() => goTo(index + 1)}
            className="h-9 w-9 rounded-full border border-line text-ink transition-colors motion-reduce:transition-none hover:bg-paper-raised disabled:cursor-default disabled:text-ink-faint disabled:hover:bg-transparent"
          >
            <span aria-hidden="true">→</span>
          </button>
        </div>

        <p aria-live="polite" className="sr-only">
          {slides[index]?.tag}
        </p>
      </div>
    </div>
  );
}
