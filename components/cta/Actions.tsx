import { site } from "@/content/site";
import { resumeLink } from "@/components/layout/nav-links";

/**
 * Book a call + the other ways to reach me, laid out side by side.
 * Every link is always visible: no hover or tap to reveal.
 */
export function Actions({ email = true, resume = true }: { email?: boolean; resume?: boolean }) {
  return (
    <div className="actions">
      <a className="button" href={site.calendarUrl} target="_blank" rel="noreferrer">
        Book a call
      </a>
      {email ? (
        <a className="text-link" href={`mailto:${site.email}`}>
          Email me
        </a>
      ) : null}
      {resume ? (
        <a className="text-link" href={resumeLink.href} download>
          {resumeLink.label}
        </a>
      ) : null}
    </div>
  );
}

export function Cta({ notes }: { notes?: string[] }) {
  return (
    <div className="cta">
      <Actions />
      {notes?.length ? (
        <p className="cta__note">
          {notes.map((n, i) => (
            <span key={n}>
              {i > 0 ? <br /> : null}
              {n}
            </span>
          ))}
        </p>
      ) : null}
    </div>
  );
}
