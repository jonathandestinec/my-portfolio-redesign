import type { ReactNode } from "react";
import { InlineLink } from "@/components/cta/InlineLink";
import { Wordmark } from "@/components/layout/Wordmark";
import type { RichText } from "@/content/types";

export function renderRichText(rt: RichText): ReactNode {
  return rt.map((part, i) =>
    typeof part === "string" ? (
      <span key={i}>{part}</span>
    ) : (
      <InlineLink key={i} href={part.href}>
        {part.text}
      </InlineLink>
    ),
  );
}

const big =
  "font-display text-[clamp(1.875rem,3vw,2.75rem)] leading-[1.2] tracking-[-0.02em]";

type Major = {
  variant: "major";
  lead: string;
  statements: RichText[];
  note?: ReactNode;
  actions?: ReactNode;
  status?: string[];
};
type Minor = {
  variant: "minor";
  title: string;
  body?: ReactNode;
  meta?: ReactNode;
};

export function PageHero(props: Major | Minor) {
  if (props.variant === "minor") {
    return (
      <header className="pb-8">
        <div className="hidden md:block">
          <Wordmark size="sm" />
        </div>
        <h1 className="md:mt-8 font-display text-[clamp(1.75rem,3.2vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.02em] text-ink">
          {props.title}
        </h1>
        {props.body ? (
          <div className="mt-4 text-[17px] text-ink-muted">{props.body}</div>
        ) : null}
        {props.meta ? (
          <div className="mt-4 text-[15px] text-ink-faint">{props.meta}</div>
        ) : null}
      </header>
    );
  }
  return (
    <header className="pb-10">
      <h1 className={`${big} font-semibold text-ink`}>{props.lead}</h1>
      <div
        className={`${big} mt-[1.1em] space-y-[1.1em] font-medium text-ink-muted`}
      >
        {props.statements.map((s, i) => (
          <p key={i}>{renderRichText(s)}</p>
        ))}
      </div>
      {props.note ? (
        <div className="mt-3 flex justify-end">{props.note}</div>
      ) : null}
      {props.actions ? <div className="mt-6">{props.actions}</div> : null}
      {props.status?.length ? (
        <div className="mt-6 text-[15px] text-ink-muted">
          {props.status.map((l) => (
            <p key={l}>{l}</p>
          ))}
        </div>
      ) : null}
    </header>
  );
}
