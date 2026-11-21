import Image from "next/image";
import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import { site } from "@/content/site";
import { paragraphs, toBlocks } from "@/lib/proposals/blocks";
import { bpsLabel, formatMoney } from "@/lib/proposals/money";
import { defaultOption, formatDate } from "@/lib/proposals/snapshot";
import type { Snapshot, SnapshotOption } from "@/lib/proposals/types";
import { ChoiceProvider, ChosenContract, ChosenText, OptionCards } from "./Choice";

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

function Section({ id, title, sub, children }: { id: string; title: string; sub?: string; children: ReactNode }) {
  return (
    <section id={id} className="section section--tight col" aria-labelledby={`${id}-title`}>
      <div className="section__head">
        <h2 id={`${id}-title`} className="section__title">
          {title}
        </h2>
        {sub ? <p className="section__sub">{sub}</p> : null}
      </div>
      {children}
    </section>
  );
}

function Bullets({ items }: { items: string[] }) {
  return (
    <ul className="features">
      {items.map((it) => (
        <li key={it}>{it}</li>
      ))}
    </ul>
  );
}

function OptionBody({ o, snapshot }: { o: SnapshotOption; snapshot: Snapshot }) {
  const money = (m: number) => formatMoney(m, snapshot.currency);
  return (
    <>
      {o.summary ? <p className="m-0 muted">{o.summary}</p> : null}
      {o.deliverables.length ? (
        <ul className="pp-deliverables">
          {o.deliverables.map((d) => (
            <li key={d.title}>
              <span className="medium">{d.title}</span>
              {d.description ? <span className="muted"> {d.description}</span> : null}
              {d.format ? <span className="pp-format">{d.format}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}
      {o.timeline.length ? (
        <ol className="pp-timeline">
          {o.timeline.map((t) => (
            <li key={t.title}>
              <span className="pp-day">{t.day ? `Day ${t.day}` : "·"}</span>
              <span>{t.title}</span>
            </li>
          ))}
        </ol>
      ) : null}
      <div className="pp-price-line">
        <span className="pp-amount pp-big">{money(o.priceMinor)}</span>
        <span className="muted text-[14px]">
          {snapshot.terms && o.depositMinor > 0 ? `${money(o.depositMinor)} deposit to start` : null}
          {o.workingDays ? `${snapshot.terms && o.depositMinor > 0 ? " · " : ""}${o.workingDays} working days` : null}
        </span>
      </div>
    </>
  );
}

export type SignedBy = {
  role: "client" | "provider";
  name: string;
  title: string | null;
  signedAt: Date;
  imageUrl: string;
  optionId?: string | null;
};

/** Everything the client reads. Used by the client page and the admin preview. */
export function ProposalView({
  snapshot,
  logoUrl,
  pdfUrl,
  signatures,
  banner,
  signing,
  afterSigning,
}: {
  snapshot: Snapshot;
  logoUrl: string | null;
  pdfUrl: string | null;
  signatures: SignedBy[];
  banner?: ReactNode;
  /** The sign form (needs the option choice, so it renders inside the choice provider). */
  signing?: ReactNode;
  /** Shown once signed: next steps such as paying the deposit. */
  afterSigning?: ReactNode;
}) {
  const s = snapshot;
  const money = (m: number) => formatMoney(m, s.currency);
  const provider = signatures.find((x) => x.role === "provider");
  const client = signatures.find((x) => x.role === "client");
  const chosen = client ? (s.options.find((o) => o.id === client.optionId) ?? defaultOption(s.options)) : null;
  const options = chosen ? [chosen] : s.options;
  const first = chosen ?? defaultOption(s.options);
  const multi = options.length > 1;
  const terms = s.terms;

  return (
    <main id="content" className="pp">
      {banner}
      <ChoiceProvider initial={first?.id ?? ""}>
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
            {s.expiresAt && !client ? <span>Valid until {formatDate(s.expiresAt)}</span> : null}
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

        <Section id="brief" title="In your words">
          <blockquote className="pp-quote">
            {paragraphs(s.brief).map((p) => (
              <p key={p}>{p}</p>
            ))}
          </blockquote>
        </Section>

        {s.objectives.length ? (
          <Section id="objectives" title="What success looks like">
            <Bullets items={s.objectives} />
          </Section>
        ) : null}

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

        <Section
          id="options"
          title={chosen ? "What you chose" : multi ? "Options" : "Scope and price"}
          sub={chosen ? undefined : multi ? "Pick the one that fits. The agreement below follows your choice." : undefined}
        >
          <OptionCards
            locked={Boolean(chosen) || !multi}
            options={options.map((o) => ({ id: o.id, name: o.name, recommended: o.recommended, body: <OptionBody o={o} snapshot={s} /> }))}
          />
        </Section>

        {s.outOfScope.length ? (
          <Section id="out" title="Not included" sub="So we’re clear from the start. Any of these can be added later as a change.">
            <Bullets items={s.outOfScope} />
          </Section>
        ) : null}

        {s.responsibilities.length ? (
          <Section id="you" title="What I’ll need from you">
            <ul className="list">
              {s.responsibilities.map((r) => (
                <li key={r.item} className="list__row">
                  <span>{r.item}</span>
                  {r.by ? <span className="muted">by {r.by}</span> : <span />}
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {s.acceptance.length ? (
          <Section id="acceptance" title="How we’ll agree it’s finished">
            <Bullets items={s.acceptance} />
          </Section>
        ) : null}

        {terms ? (
          <Section id="payment" title="Payment">
            <dl className="facts">
              <div className="facts__row">
                <dt>Deposit</dt>
                <dd>
                  {terms.depositPercent}% before any work begins (<ChosenText values={Object.fromEntries(options.map((o) => [o.id, money(o.depositMinor)]))} />
                  ), due within {terms.depositDueDays} days of signing.
                </dd>
              </div>
              <div className="facts__row">
                <dt>Balance</dt>
                <dd>
                  <ChosenText values={Object.fromEntries(options.map((o) => [o.id, money(o.balanceMinor)]))} /> on acceptance, due within{" "}
                  {terms.balanceDueDays} days. The invoice states the exact date.
                </dd>
              </div>
              <div className="facts__row">
                <dt>Late</dt>
                <dd>{bpsLabel(terms.lateFeeBps)} per month on overdue amounts.</dd>
              </div>
              <div className="facts__row">
                <dt>Pause</dt>
                <dd>Work pauses once a payment is {terms.stopWorkDays} working days late, and resumes when it’s paid.</dd>
              </div>
            </dl>
          </Section>
        ) : null}

        <Section id="contract" title="Agreement" sub={chosen ? undefined : multi ? "Shown for the option you’ve selected above." : undefined}>
          <ChosenContract contracts={options.map((o) => ({ id: o.id, node: <ContractText text={o.contract} /> }))} />
          {pdfUrl ? (
            <p className="m-0">
              <a href={pdfUrl} className="text-link">
                Download as PDF
              </a>
            </p>
          ) : null}
        </Section>

        {client ? null : (
          <Section id="yes" title="How to say yes">
            <ol className="pp-steps">
              {multi ? (
                <li>
                  <span className="medium">Pick an option</span> above. You’ve selected{" "}
                  <ChosenText values={Object.fromEntries(options.map((o) => [o.id, `${o.name} (${money(o.priceMinor)})`]))} />.
                </li>
              ) : null}
              <li>
                <span className="medium">Sign below</span> with your name and a typed or drawn signature. It takes a minute.
              </li>
              {terms && first && first.depositMinor > 0 ? (
                <li>
                  <span className="medium">Pay the deposit</span> of{" "}
                  <ChosenText values={Object.fromEntries(options.map((o) => [o.id, money(o.depositMinor)]))} />. The invoice appears here as soon as
                  you sign, with a card payment link and bank details.
                </li>
              ) : null}
              <li>
                <span className="medium">We start.</span> I begin on the next working day after{" "}
                {terms && first && first.depositMinor > 0 ? "the deposit arrives" : "you sign"}, and the timeline counts from there.
              </li>
            </ol>
          </Section>
        )}

        <Section id="sign" title={client ? "Signed" : "Sign"}>
          <div className="pp-signatures">
            {provider ? <SignatureCard sig={provider} /> : null}
            {client ? <SignatureCard sig={client} /> : null}
          </div>
          {client ? afterSigning : signing}
        </Section>
      </ChoiceProvider>

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
