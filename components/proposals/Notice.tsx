import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { site } from "@/content/site";

/** A plain page with no client data: unavailable links and the passcode screen. */
export function Notice({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <main id="content" className="pp pp--notice">
      <div className="col pp-head">
        <Wordmark />
        <div className="lead">
          <h1>{title}</h1>
        </div>
        {children}
      </div>
    </main>
  );
}

export function Unavailable() {
  return (
    <Notice title="This proposal is no longer available.">
      <div className="cta">
        <p className="m-0 muted">It may have expired or been replaced. Get in touch and I’ll send you a fresh link.</p>
        <div className="actions">
          <a href={`mailto:${site.email}`} className="button">
            Email me
          </a>
          <Link href="/" className="text-link">
            Visit my site
          </Link>
        </div>
      </div>
    </Notice>
  );
}
