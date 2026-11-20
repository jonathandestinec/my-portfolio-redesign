import Link from "next/link";
import type { ReactNode } from "react";

export function DeskHeader({ crumbs, actions }: { crumbs: { href?: string; label: string }[]; actions?: ReactNode }) {
  return (
    <header className="desk-head">
      <nav aria-label="Breadcrumb" className="desk-crumbs">
        <Link href="/keystatic" className="desk-brand">
          Studio
        </Link>
        {crumbs.map((c, i) => (
          <span key={i}>
            <span className="faint" aria-hidden="true">
              /
            </span>{" "}
            {c.href ? (
              <Link href={c.href} className="text-link">
                {c.label}
              </Link>
            ) : (
              <span aria-current="page">{c.label}</span>
            )}
          </span>
        ))}
      </nav>
      {actions ? <div className="actions">{actions}</div> : null}
    </header>
  );
}

/** Shown when the GitHub sign-in is missing or belongs to someone else. */
export function SignInFirst() {
  return (
    <div className="desk-wrap">
      <DeskHeader crumbs={[{ label: "Proposals" }]} />
      <div className="card">
        <div className="card__body">
          <p className="m-0 medium">Sign in first</p>
          <p className="m-0 muted">
            Proposals use your GitHub sign-in from Studio. Open Studio, sign in with GitHub, then come back here.
          </p>
          <div className="actions">
            <a href="/keystatic" className="button">
              Open Studio
            </a>
            <Link href="/desk" className="text-link">
              Try again
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function NotSetUp() {
  return (
    <div className="desk-wrap">
      <DeskHeader crumbs={[{ label: "Proposals" }]} />
      <p className="muted">The proposals database isn’t configured. Set DATABASE_URL (see README).</p>
    </div>
  );
}
