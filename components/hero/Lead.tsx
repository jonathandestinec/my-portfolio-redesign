import Link from "next/link";
import type { ReactNode } from "react";
import { externalProps, isExternal } from "@/components/layout/nav-links";
import type { RichText, RichLink } from "@/content/types";

/** Hand-drawn arrow + Caveat note that hangs under the end of a link. */
export function Note({ text }: { text: string }) {
  return (
    <span className="note" aria-hidden="true">
      <svg className="note__arrow" viewBox="0 0 44 36" fill="none">
        <path
          className="note__arrow-shaft"
          pathLength={1}
          d="M41 5.5C31.5 2.5 21 6 15.5 13.5C12 18.5 9.5 23 8 28.5"
        />
        <path className="note__arrow-head" pathLength={1} d="M4 19L8 29L17.5 23.5" />
      </svg>
      <span className="note__text">{text}</span>
    </span>
  );
}

function LeadLink({ part }: { part: RichLink }) {
  const cls = `lead__link${part.note ? " note__link" : ""}`;
  const inner = (
    <>
      {part.text}
      {part.note ? <Note text={part.note} /> : null}
    </>
  );
  if (isExternal(part.href)) {
    return (
      <a href={part.href} className={cls} {...externalProps(part.href)}>
        {inner}
      </a>
    );
  }
  return (
    <Link href={part.href} className={cls}>
      {inner}
    </Link>
  );
}

export function renderRichText(rt: RichText): ReactNode {
  return rt.map((part, i) => {
    if (typeof part === "string") return <span key={i}>{part}</span>;
    return (
      <span key={i}>
        {/* On narrow phones the noted link starts a new line so the note has room. */}
        {part.note ? <br className="note__break" /> : null}
        <LeadLink part={part} />
      </span>
    );
  });
}

/**
 * Display-type block used at the top of every page: one highlighted line,
 * then grey statements, all at weight 400 like the reference.
 */
export function Lead({
  title,
  statements = [],
  children,
}: {
  title: ReactNode;
  statements?: RichText[];
  children?: ReactNode;
}) {
  return (
    <div className="lead">
      <h1>
        <span className="hl">{title}</span>
      </h1>
      {statements.map((s, i) => (
        <p key={i}>{renderRichText(s)}</p>
      ))}
      {children}
    </div>
  );
}

/** Page intro wrapper: column, top spacing, and (on detail pages) the wordmark. */
export function Intro({
  children,
  narrow,
  logo,
}: {
  children: ReactNode;
  narrow?: boolean;
  /** Show the wordmark above the intro on desktop too (detail pages). */
  logo?: ReactNode;
}) {
  return (
    <header className={`col intro${narrow ? " col--lead" : ""}`}>
      {logo ? <div className="intro__logo-desk">{logo}</div> : null}
      {children}
    </header>
  );
}
