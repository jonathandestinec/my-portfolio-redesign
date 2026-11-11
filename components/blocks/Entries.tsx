import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import type { Education, Logo, Role } from "@/content/types";
import { rangeLabel } from "@/lib/content";
import { EntryAnchor } from "./EntryAnchor";

export function LogoMark({ logo }: { logo: Logo }) {
  return (
    <span className="logo-mark" aria-hidden="true">
      {"src" in logo ? (
        <Image src={logo.src} alt="" width={40} height={40} />
      ) : (
        logo.initials
      )}
    </span>
  );
}

function Plus() {
  return (
    <svg className="entry__plus" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M6 1.5v9M1.5 6h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

type EntryProps = {
  /** Only the full lists get ids: hidden, still-mounted pages would otherwise duplicate them. */
  id?: string;
  logo: Logo;
  title: string;
  meta: string;
  summary: string;
  children: ReactNode;
};

/** One card row that opens in place (native <details>, works without JS). */
function Entry({ id, logo, title, meta, summary, children }: EntryProps) {
  return (
    <li>
      <details id={id} className="entry">
        <summary className="entry__summary">
          <LogoMark logo={logo} />
          <span className="entry__head">
            <span>
              <span className="entry__title block" role="heading" aria-level={3}>
                {title}
              </span>
              <span className="entry__meta">{meta}</span>
            </span>
            <span className="entry__text">{summary}</span>
          </span>
          <Plus />
        </summary>
        <div className="entry__more">{children}</div>
      </details>
    </li>
  );
}

function Org({ name, url }: { name: string; url?: string }) {
  if (!url) return <>{name}</>;
  return (
    <a href={url} target="_blank" rel="noreferrer" className="text-link">
      {name} ↗
    </a>
  );
}

export function RoleList({
  roles,
  full,
}: {
  roles: Role[];
  /** On the Experience page every detail is shown; elsewhere a short version plus a link. */
  full?: boolean;
}) {
  return (
    <>
      <ul className="list">
        {roles.map((r) => (
          <Entry
            key={r.slug}
            id={full ? r.slug : undefined}
            logo={r.logo}
            title={`${r.title} · ${r.company}`}
            meta={[rangeLabel(r.start, r.end), r.type, r.location].filter(Boolean).join(" · ")}
            summary={r.summary}
          >
            <p className="entry__text">{r.details}</p>
            <ul className="features">
              {(full ? r.highlights : r.highlights.slice(0, 2)).map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {full ? (
              <>
                <ul className="chips" aria-label="Stack">
                  {r.stack.map((s) => (
                    <li key={s} className="chip">
                      {s}
                    </li>
                  ))}
                </ul>
                {r.companyUrl ? (
                  <p>
                    <Org name={r.company} url={r.companyUrl} />
                  </p>
                ) : null}
              </>
            ) : (
              <p>
                <Link href={`/experience#${r.slug}`} className="text-link">
                  Full details →
                </Link>
              </p>
            )}
          </Entry>
        ))}
      </ul>
      {full ? <EntryAnchor /> : null}
    </>
  );
}

export function EducationList({ items, full }: { items: Education[]; full?: boolean }) {
  return (
    <>
      <ul className="list">
        {items.map((e) => (
          <Entry
            key={e.slug}
            id={full ? e.slug : undefined}
            logo={e.logo}
            title={`${e.course} · ${e.institution}`}
            meta={`${e.date} · ${e.location}`}
            summary={e.summary}
          >
            <p className="entry__text">{e.details}</p>
            <ul className="features">
              {e.highlights.map((h) => (
                <li key={h}>{h}</li>
              ))}
            </ul>
            {full ? (
              e.institutionUrl ? (
                <p>
                  <Org name={e.institution} url={e.institutionUrl} />
                </p>
              ) : null
            ) : (
              <p>
                <Link href={`/education#${e.slug}`} className="text-link">
                  Full details →
                </Link>
              </p>
            )}
          </Entry>
        ))}
      </ul>
      {full ? <EntryAnchor /> : null}
    </>
  );
}
