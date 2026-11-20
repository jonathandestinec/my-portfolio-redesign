"use client";

import { DogSticker } from "stick-it-up";

/**
 * Decorative sticker slapped next to the hero greeting (stick-it-up, which uses
 * hooks without a "use client" banner, hence this wrapper). It sits in an
 * inline box one line tall so it never changes the heading's line height.
 */
export function HeroSticker() {
  return (
    <span className="hero-sticker" aria-hidden="true">
      {/* The sticker sets its own inline transform for the peel, so the
          centring and tilt live on this wrapper instead. */}
      <span className="hero-sticker__art">
        <DogSticker size="100%" peel focusable="false" />
      </span>
    </span>
  );
}
