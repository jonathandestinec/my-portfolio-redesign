"use client";

import Link from "next/link";
import { useEffect } from "react";
import { Wordmark } from "@/components/layout/Wordmark";

/** Shown when a page fails while rendering. Never the framework default. */
export default function ErrorPage({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);
  const digest = error instanceof Error && "digest" in error ? String((error as Error & { digest?: string }).digest ?? "") : "";

  return (
    <main id="content" className="col col--lead">
      <div className="intro">
        <Wordmark />
        <div className="lead">
          <h1>Something broke on my side.</h1>
          <p>It isn’t you. Try again, and if it keeps happening, let me know.</p>
        </div>
        <div className="cta">
          <div className="actions">
            <button type="button" className="button" onClick={() => retry()}>
              Try again
            </button>
            <Link href="/" className="text-link">
              Back home
            </Link>
          </div>
          {digest ? <p className="cta__note">Reference: {digest}</p> : null}
        </div>
      </div>
    </main>
  );
}
