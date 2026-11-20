"use client";

/**
 * Last-resort page when the root layout itself fails. It renders its own
 * document, so it carries its own styles (the site's colours, light and dark).
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en">
      <body>
        <title>Something broke — Destine Jonathan</title>
        <style>{`
          :root { color-scheme: light dark; --paper:#f2efe8; --ink:#21201d; --muted:#5d5b55; --pill:#171614; --pill-ink:#fff; }
          @media (prefers-color-scheme: dark) { :root { --paper:#171614; --ink:#edeae3; --muted:#a29e96; --pill:#edeae3; --pill-ink:#171614; } }
          body { margin:0; min-height:100svh; display:grid; place-items:center; background:var(--paper); color:var(--ink);
                 font: 15px/22px ui-sans-serif, system-ui, -apple-system, "Segoe UI", sans-serif; }
          main { width:min(560px, 100% - 40px); display:flex; flex-direction:column; gap:20px; }
          h1 { margin:0; font-size:28px; line-height:1.15; font-weight:500; letter-spacing:-0.03em; }
          p { margin:0; color:var(--muted); }
          .row { display:flex; gap:16px; align-items:center; flex-wrap:wrap; }
          button { height:32px; padding:0 14px; border:0; border-radius:999px; background:var(--pill); color:var(--pill-ink); font:inherit; font-weight:500; cursor:pointer; }
          a { color:var(--muted); text-underline-offset:3px; }
        `}</style>
        <main>
          <h1>Something broke on my side.</h1>
          <p>It isn’t you. Try again, and if it keeps happening, let me know.</p>
          <div className="row">
            <button type="button" onClick={() => retry()}>
              Try again
            </button>
            {/* A full reload: the app's router may be what failed. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/">Back home</a>
          </div>
        </main>
      </body>
    </html>
  );
}
