"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type PointerEvent,
} from "react";
import type { CarouselSlide } from "@/lib/content";

const CLICK_SLOP = 6;
const EASE = "transform 0.5s cubic-bezier(0.2, 0.8, 0.2, 1)";
/** Horizontal wheel distance (px) that moves one slide. */
const WHEEL_STEP = 30;
/** A pause this long (ms) between wheel events starts a new gesture. */
const WHEEL_GESTURE_GAP = 180;

/**
 * Works strip, after the reference: a fixed blue frame and label sit in the
 * middle of the page while the slides move underneath it. Drag or swipe with
 * momentum, click a neighbour to bring it in, arrow keys when focused, and
 * click the framed slide (or its label) to open it.
 */
export function WorkCarousel({
  slides,
  label = "Selected work",
}: {
  slides: CarouselSlide[];
  label?: string;
}) {
  const [index, setIndex] = useState(0);
  const [dx, setDx] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [pressed, setPressed] = useState(false);
  const [step, setStep] = useState(0);
  const [reduce, setReduce] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const linkRefs = useRef<(HTMLAnchorElement | null)[]>([]);
  const drag = useRef({ id: -1, x0: 0, moved: false, trail: [] as [number, number][] });

  const last = slides.length - 1;
  const clamp = useCallback((i: number) => Math.max(0, Math.min(last, i)), [last]);

  // Distance between slide starts: one slide plus the gap.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const measure = () => {
      const first = track.children[0] as HTMLElement | undefined;
      if (!first) return;
      const gap = parseFloat(getComputedStyle(track).columnGap) || 0;
      setStep(first.offsetWidth + gap);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(track);
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMq = () => setReduce(mq.matches);
    onMq();
    mq.addEventListener("change", onMq);
    return () => {
      ro.disconnect();
      mq.removeEventListener("change", onMq);
    };
  }, []);

  // Desktop scrolling: a horizontal trackpad swipe (or Shift + mouse wheel) moves
  // one slide per gesture. Plain vertical wheel keeps scrolling the page.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const w = { acc: 0, last: -Infinity, moved: false };
    const onWheel = (e: WheelEvent) => {
      const horizontal = Math.abs(e.deltaX) > Math.abs(e.deltaY);
      const delta = horizontal ? e.deltaX : e.shiftKey ? e.deltaY : 0;
      if (!delta) return;
      e.preventDefault();
      const quiet = e.timeStamp - w.last > WHEEL_GESTURE_GAP;
      w.last = e.timeStamp;
      if (quiet) {
        w.acc = 0;
        w.moved = false;
      }
      // One move per gesture: trackpad momentum keeps firing after the first step.
      if (w.moved) return;
      w.acc += delta;
      if (Math.abs(w.acc) >= WHEEL_STEP) {
        // Read the direction now: the updater runs later, after acc is reset.
        const dir = Math.sign(w.acc);
        setIndex((i) => clamp(i + dir));
        w.moved = true;
        w.acc = 0;
      }
    };
    track.addEventListener("wheel", onWheel, { passive: false });
    return () => track.removeEventListener("wheel", onWheel);
  }, [clamp]);

  function onPointerDown(e: PointerEvent<HTMLDivElement>) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    drag.current = { id: e.pointerId, x0: e.clientX, moved: false, trail: [[e.timeStamp, e.clientX]] };
    setPressed(true);
  }

  function onPointerMove(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    let delta = e.clientX - d.x0;
    if (!d.moved && Math.abs(delta) < CLICK_SLOP) return;
    if (!d.moved) {
      d.moved = true;
      setDragging(true);
      setPressed(false);
      trackRef.current?.setPointerCapture(e.pointerId);
    }
    // Rubber band past the first and last slide.
    if ((index === 0 && delta > 0) || (index === last && delta < 0)) delta *= 0.35;
    d.trail.push([e.timeStamp, e.clientX]);
    if (d.trail.length > 6) d.trail.shift();
    setDx(delta);
  }

  function onPointerEnd(e: PointerEvent<HTMLDivElement>) {
    const d = drag.current;
    if (d.id !== e.pointerId) return;
    d.id = -1;
    setPressed(false);
    if (!d.moved) return;
    const [t0, x0] = d.trail[0];
    const dt = Math.max(1, e.timeStamp - t0);
    const velocity = (e.clientX - x0) / dt; // px per ms
    const projected = dx + velocity * 220;
    const moveBy = step ? Math.round(-projected / step) : 0;
    setIndex((i) => clamp(i + moveBy));
    setDx(0);
    setDragging(false);
  }

  function onSlideClick(e: MouseEvent<HTMLAnchorElement>, i: number) {
    if (drag.current.moved) {
      e.preventDefault();
      drag.current.moved = false;
      return;
    }
    if (i !== index) {
      e.preventDefault();
      setIndex(i);
    }
  }

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
      e.preventDefault();
      setIndex((i) => clamp(i + (e.key === "ArrowRight" ? 1 : -1)));
    } else if (e.key === "Enter") {
      e.preventDefault();
      linkRefs.current[index]?.click();
    }
  }

  const current = slides[index];
  const offset = -index * step + dx;

  return (
    <div
      className="strip"
      role="region"
      aria-roledescription="carousel"
      aria-label={label}
    >
      <div className="strip__stage">
        <div
          ref={trackRef}
          className={`track${dragging ? " is-dragging" : ""}`}
          tabIndex={0}
          aria-label={`${label}: use left and right arrow keys to browse, Enter to open`}
          onKeyDown={onKeyDown}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerEnd}
          onPointerCancel={onPointerEnd}
          style={{
            transform: `translate3d(${offset}px, 0, 0)`,
            transition: dragging || reduce ? "none" : EASE,
          }}
        >
          {slides.map((s, i) => (
            <div
              key={`${s.image.src}-${i}`}
              className={`slide${i === index ? " is-current" : ""}${i === index && pressed ? " is-pressed" : ""}`}
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${slides.length}: ${s.tag}`}
            >
              <Link
                ref={(el) => {
                  linkRefs.current[i] = el;
                }}
                href={s.href}
                tabIndex={-1}
                draggable={false}
                className="slide__link"
                onClick={(e) => onSlideClick(e, i)}
              >
                <div className="slide__cover">
                  <Image
                    src={s.image.src}
                    alt={s.image.alt}
                    fill
                    draggable={false}
                    priority={i === 0}
                    sizes="(max-width: 679px) calc(100vw - 80px), (max-width: 1119px) calc(100vw - 112px), 960px"
                    className={s.phone ? "object-contain py-[6%]" : "object-cover object-top"}
                  />
                </div>
              </Link>
            </div>
          ))}
        </div>
        <div className="frame" aria-hidden="false">
          <div className="frame__outline" />
          <Link href={current.href} className="frame__label" tabIndex={-1}>
            <span key={index} className="frame__name">
              {current.tag}
            </span>
          </Link>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {current.tag}, slide {index + 1} of {slides.length}
      </p>
    </div>
  );
}
