import Image from "next/image";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { site } from "@/content/site";
import { paragraphs, toBlocks } from "@/lib/proposals/blocks";
import { formatMoney } from "@/lib/proposals/money";
import { formatDate } from "@/lib/proposals/snapshot";
import type { Snapshot } from "@/lib/proposals/types";

const ext = { target: "_blank", rel: "noreferrer" } as const;

function initials(name: string) {
  return (
    name
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join("") || "?"
  );
}

function ClientMark({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  return logoUrl ? (
    // Served from private storage through a proposal route; not optimised by next/image on purpose.
    // eslint-disable-next-line @next/next/no-img-element
    <img src={logoUrl} alt={`${name} logo`} className="pp-logo" />
  ) : (
    <span className="pp-logo pp-logo--initials" aria-label={`${name} logo`}>
      {initials(name)}
    </span>
  );
}

export function ContractText({ text }: { text: string }) {
  return (
    <div className="pp-contract">
      {toBlocks(text).map((b, i) =>
        b.type === "h" ? (
          <h3 key={i}>{b.text}</h3>
        ) : b.type === "ul" ? (
          <ul key={i}>
            {b.items.map((it, j) => (
              <li key={j}>{it}</li>
            ))}
          </ul>
        ) : (
          <p key={i}>{b.text}</p>
        ),
      )}
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section id={id} className="section section--tight col" aria-labelledby={`${id}-title`}>
      <div className="section__head">
        <h2 id={`${id}-title`} className="section__title">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

export type SignedBy = { role: "client" | "provider"; name: string; title: string | null; signedAt: Date; imageUrl: string };

/** Everything the client reads. Used by the client page, the admin preview and (in spirit) the PDF. */
export function ProposalView({
  snapshot,
  logoUrl,
  pdfUrl,
  signatures,
  banner,
  signing,
}: {
  snapshot: Snapshot;
  logoUrl: string | null;
  pdfUrl: string | null;
  signatures: SignedBy[];
  banner?: ReactNode;
  signing?: ReactNode;
}) {
  const s = snapshot;
  const money = (m: number) => formatMoney(m, s.currency);
  const provider = signatures.find((x) => x.role === "provider");
  const client = signatures.find((x) => x.role === "client");

  return (
    <main id="content" className="pp">
      {banner}
      <header className="col pp-head">
        <div className="pp-brands" aria-label={`${s.provider.name} and ${s.client.name}`}>
          <Wordmark />
          <span className="pp-x" aria-hidden="true">
            ×
          </span>
          <ClientMark name={s.client.name} logoUrl={logoUrl} />
        </div>
        <div className="lead">
          <h1>
            Proposal for <span className="hl">{s.client.name}</span>
          </h1>
        </div>
        <p className="pp-meta">
          <span>Issued {formatDate(s.issuedAt)}</span>
          {s.expiresAt ? <span>Valid until {formatDate(s.expiresAt)}</span> : null}
          <span>Version {s.version}</span>
        </p>
      </header>

      {s.intro ? (
        <div className="col pp-intro">
          {paragraphs(s.intro).map((p) => (
            <p key={p}>{p}</p>
          ))}
          <p className="pp-from">
            {s.provider.name}, {s.provider.title}
          </p>
        </div>
      ) : null}

      <Section id="brief" title="What you need">
        <div className="story">
          {paragraphs(s.brief).map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </Section>

      {s.work.length ? (
        <section id="work" className="section section--tight" aria-labelledby="work-title">
          <div className="col section__head">
            <h2 id="work-title" className="section__title">
              Relevant work
            </h2>
            <p className="section__sub">Things I’ve built that are closest to this.</p>
          </div>
          <div className="col cards">
            {s.work.map((w) => (
              <article key={w.key} className="card">
                {w.cover ? (
                  <div className="card__art">
                    <Image
                      src={w.cover.src}
                      alt={w.cover.alt}
                      width={1600}
                      height={1000}
                      sizes="(max-width: 679px) calc(100vw - 40px), 600px"
                      className="block h-auto w-full"
                    />
                  </div>
                ) : null}
                <div className="card__body">
                  <div className="flex flex-col gap-1">
                    <h3 className="m-0 text-[15px] font-medium">{w.name}</h3>
                    <p className="m-0 muted">{w.note || w.summary}</p>
                  </div>
                  {w.caseStudyUrl || w.liveUrl ? (
                    <div className="actions">
                      {w.caseStudyUrl ? (
                        <a href={w.caseStudyUrl} className="text-link" {...ext}>
                          Read the case study
                        </a>
                      ) : null}
                      {w.liveUrl ? (
                        <a href={w.liveUrl} className="text-link" {...ext}>
                          {w.liveUrl.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                        </a>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>
      ) : null}

      {s.scope.length ? (
        <Section id="scope" title="Scope">
          <ul className="list">
            {s.scope.map((item, i) => (
              <li key={i} className="list__item">
                <span className="medium">{item.title}</span>
                {item.description ? <span className="muted">{item.description}</span> : null}
              </li>
            ))}
          </ul>
        </Section>
      ) : null}

      <Section id="price" title="Milestones and price">
        <ul className="list pp-price">
          {s.milestones.map((m, i) => (
            <li key={i} className="list__row">
              <span className="flex flex-col gap-0.5">
                <span className="medium">{m.title}</span>
                {m.description ? <span className="muted">{m.description}</span> : null}
                {m.due ? <span className="faint text-[14px]">{m.due}</span> : null}
              </span>
              <span className="pp-amount">{money(m.amountMinor)}</span>
            </li>
          ))}
          <li className="list__row pp-total">
            <span className="medium">Total</span>
            <span className="pp-amount medium">{money(s.totalMinor)}</span>
          </li>
        </ul>
      </Section>

      <Section id="contract" title="Agreement">
        <ContractText text={s.contract} />
        {pdfUrl ? (
          <p className="m-0">
            <a href={pdfUrl} className="text-link">
              Download as PDF
            </a>
          </p>
        ) : null}
      </Section>

      <Section id="sign" title={client ? "Signed" : "Sign"}>
        <div className="pp-signatures">
          {provider ? <SignatureCard sig={provider} /> : null}
          {client ? <SignatureCard sig={client} /> : null}
        </div>
        {client ? null : signing}
      </Section>

      <footer className="col pp-foot">
        <p className="m-0 closing__statement">Questions about any of this?</p>
        <div className="actions">
          <a href={site.calendarUrl} className="button" {...ext}>
            Book a call
          </a>
          <a href={`mailto:${s.provider.email}`} className="text-link">
            {s.provider.email}
          </a>
        </div>
      </footer>
    </main>
  );
}

function SignatureCard({ sig }: { sig: SignedBy }) {
  return (
    <figure className="pp-sig">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={sig.imageUrl} alt={`Signature of ${sig.name}`} className="pp-sig__img" />
      <figcaption>
        <span className="medium">{sig.name}</span>
        {sig.title ? <span className="muted">{sig.title}</span> : null}
        <span className="faint">Signed {formatDate(sig.signedAt)}</span>
      </figcaption>
    </figure>
  );
}
