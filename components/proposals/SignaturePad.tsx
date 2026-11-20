"use client";

import { useCallback, useEffect, useImperativeHandle, useRef, useState, type Ref } from "react";

export type SignatureMethod = "typed" | "drawn";
export type SignaturePadHandle = {
  /** PNG data URL of the signature, or null when nothing has been typed or drawn yet. */
  toDataUrl: () => Promise<string | null>;
};

const W = 600;
const H = 180;

function handFont(): string {
  const v = getComputedStyle(document.documentElement).getPropertyValue("--font-hand-src").trim();
  return v || "cursive";
}

/** Renders a typed name in the handwriting font onto a canvas, so typed and drawn signatures are both images. */
async function typedToPng(name: string, ink: string): Promise<string> {
  const family = handFont();
  await document.fonts.load(`64px ${family}`).catch(() => undefined);
  const c = document.createElement("canvas");
  c.width = W * 2;
  c.height = H * 2;
  const ctx = c.getContext("2d")!;
  ctx.scale(2, 2);
  let size = 72;
  ctx.font = `${size}px ${family}`;
  while (ctx.measureText(name).width > W - 48 && size > 28) {
    size -= 4;
    ctx.font = `${size}px ${family}`;
  }
  ctx.fillStyle = ink;
  ctx.textBaseline = "middle";
  ctx.fillText(name, 24, H / 2 + 6);
  return c.toDataURL("image/png");
}

export function SignaturePad({
  ref,
  name,
  methods = ["typed", "drawn"],
  onChange,
}: {
  ref: Ref<SignaturePadHandle>;
  /** The typed signature mirrors this name. */
  name: string;
  methods?: SignatureMethod[];
  onChange?: (state: { method: SignatureMethod; ready: boolean }) => void;
}) {
  const [method, setMethod] = useState<SignatureMethod>(methods[0]);
  const [drawn, setDrawn] = useState(false);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef<{ x: number; y: number } | null>(null);

  // Signatures are stored in dark ink whatever the page theme.
  const INK = "#171614";

  useEffect(() => {
    onChange?.({ method, ready: method === "typed" ? name.trim().length > 1 : drawn });
  }, [method, name, drawn, onChange]);

  const setupCanvas = useCallback(() => {
    const c = canvas.current;
    if (!c) return;
    c.width = W * 2;
    c.height = H * 2;
    const ctx = c.getContext("2d")!;
    ctx.scale(2, 2);
    ctx.lineWidth = 2.4;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = INK;
  }, []);

  useEffect(() => {
    if (method === "drawn") setupCanvas();
  }, [method, setupCanvas]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * W, y: ((e.clientY - r.top) / r.height) * H };
  };

  useImperativeHandle(ref, () => ({
    toDataUrl: async () => {
      if (method === "typed") return name.trim() ? typedToPng(name.trim(), INK) : null;
      return drawn && canvas.current ? canvas.current.toDataURL("image/png") : null;
    },
  }));

  return (
    <div className="pp-pad">
      {methods.length > 1 ? (
        <div className="pp-tabs" role="tablist" aria-label="How to sign">
          {methods.map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={method === m}
              className={`pp-tab${method === m ? " is-on" : ""}`}
              onClick={() => setMethod(m)}
            >
              {m === "typed" ? "Type" : "Draw"}
            </button>
          ))}
        </div>
      ) : null}
      {method === "typed" ? (
        <div className="pp-pad__area pp-pad__typed" aria-live="polite">
          {name.trim() ? <span>{name.trim()}</span> : <span className="faint pp-pad__hint">Your name appears here</span>}
        </div>
      ) : (
        <div className="pp-pad__area">
          <canvas
            ref={canvas}
            className="pp-pad__canvas"
            aria-label="Draw your signature"
            onPointerDown={(e) => {
              e.currentTarget.setPointerCapture(e.pointerId);
              drawing.current = point(e);
            }}
            onPointerMove={(e) => {
              const from = drawing.current;
              if (!from) return;
              const to = point(e);
              const ctx = e.currentTarget.getContext("2d")!;
              ctx.beginPath();
              ctx.moveTo(from.x, from.y);
              ctx.lineTo(to.x, to.y);
              ctx.stroke();
              drawing.current = to;
              if (!drawn) setDrawn(true);
            }}
            onPointerUp={() => (drawing.current = null)}
            onPointerCancel={() => (drawing.current = null)}
          />
          {drawn ? (
            <button
              type="button"
              className="text-link pp-pad__clear"
              onClick={() => {
                setupCanvas();
                setDrawn(false);
              }}
            >
              Clear
            </button>
          ) : (
            <span className="faint pp-pad__hint pp-pad__hint--draw">Sign with your finger or mouse</span>
          )}
        </div>
      )}
    </div>
  );
}
