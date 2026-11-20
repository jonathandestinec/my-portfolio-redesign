"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  acceptWorkAction,
  deleteAction,
  duplicateAction,
  extendAction,
  issueDepositAction,
  markPaidAction,
  passcodeAction,
  saveAction,
  sendAction,
  voidInvoiceAction,
  withdrawAction,
} from "@/app/desk/actions";
import { rankWork } from "@/lib/proposals/match";
import { amountInput, bpsLabel, formatMoney, parseAmount, split } from "@/lib/proposals/money";
import { optionDays, readiness } from "@/lib/proposals/snapshot";
import { STATUS_LABEL, isEditable } from "@/lib/proposals/status";
import { placeholders } from "@/lib/proposals/template";
import { emptyOption, type ProposalContent, type ProposalOption, type Status } from "@/lib/proposals/types";
import { SignaturePad, type SignatureMethod, type SignaturePadHandle } from "./SignaturePad";

const KNOWN = new Set([
  "client", "contact", "provider", "providerTitle", "option", "overview", "objectives", "scopeIn", "scopeOut", "deliverables",
  "timeline", "workingDays", "responsibilities", "acceptance", "payment", "total", "deposit", "balance", "depositPercent",
  "lateFee", "currency", "date", "validUntil", "scope", "milestones",
]);

type CatalogEntry = { key: string; name: string; summary: string; tags: string[] };
type Sig = {
  id: string;
  role: "client" | "provider";
  version: number;
  name: string;
  email: string;
  signedAt: string;
  ip: string | null;
  contentSha256: string;
  imageUrl: string;
  pdfUrl: string | null;
  optionName: string | null;
};
export type DeskInvoice = {
  id: string;
  number: string;
  kind: "deposit" | "balance";
  amountMinor: number;
  currency: ProposalContent["currency"];
  state: "paid" | "void" | "unpaid" | "overdue";
  dueAt: string;
  paidAt: string | null;
  paidVia: string | null;
  daysLate: number;
  url: string;
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos", timeZoneName: "short" }).format(new Date(iso));
const fmtDay = (iso: string) => new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "Africa/Lagos" }).format(new Date(iso));

function move<T>(list: T[], i: number, by: number): T[] {
  const j = i + by;
  if (j < 0 || j >= list.length) return list;
  const next = [...list];
  [next[i], next[j]] = [next[j], next[i]];
  return next;
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

function Panel({ title, sub, children, id }: { title: string; sub?: string; children: React.ReactNode; id?: string }) {
  return (
    <section className="card" id={id}>
      <div className="card__body">
        <div className="section__head">
          <h2 className="section__title">{title}</h2>
          {sub ? <p className="section__sub">{sub}</p> : null}
        </div>
        {children}
      </div>
    </section>
  );
}

function RowTools({ onUp, onDown, onRemove }: { onUp: () => void; onDown: () => void; onRemove: () => void }) {
  return (
    <span className="desk-tools">
      <button type="button" className="text-link" onClick={onUp} aria-label="Move up">
        ↑
      </button>
      <button type="button" className="text-link" onClick={onDown} aria-label="Move down">
        ↓
      </button>
      <button type="button" className="text-link" onClick={onRemove}>
        Remove
      </button>
    </span>
  );
}

/** Amount field: keeps what you type, reports whole minor units when it parses. */
function MoneyInput({ label, value, currency, onChange }: { label: string; value: number; currency: ProposalContent["currency"]; onChange: (minor: number) => void }) {
  const [text, setText] = useState(value ? amountInput(value) : "");
  const bad = text.trim() !== "" && parseAmount(text) === null;
  return (
    <Field label={label} hint={bad ? "Use a number like 150,000 or 1500.50" : formatMoney(value, currency)}>
      <input
        className="field__input"
        inputMode="decimal"
        value={text}
        aria-invalid={bad}
        onChange={(e) => {
          setText(e.target.value);
          const p = parseAmount(e.target.value);
          onChange(p ?? 0);
        }}
      />
    </Field>
  );
}

/** An editable list of short lines (objectives, out of scope, acceptance criteria). */
function TextList({ items, onChange, placeholder, add }: { items: string[]; onChange: (v: string[]) => void; placeholder: string; add: string }) {
  return (
    <>
      {items.length ? (
        <ul className="desk-lines">
          {items.map((it, i) => (
            <li key={i} className="desk-row-head">
              <input className="field__input" placeholder={placeholder} value={it} onChange={(e) => onChange(items.map((x, j) => (j === i ? e.target.value : x)))} />
              <RowTools onUp={() => onChange(move(items, i, -1))} onDown={() => onChange(move(items, i, 1))} onRemove={() => onChange(items.filter((_, j) => j !== i))} />
            </li>
          ))}
        </ul>
      ) : null}
      <div className="actions">
        <button type="button" className="button button--pale" onClick={() => onChange([...items, ""])}>
          {add}
        </button>
      </div>
    </>
  );
}

function OptionEditor({
  o,
  index,
  count,
  currency,
  depositPercent,
  onChange,
  onRemove,
  onRecommend,
}: {
  o: ProposalOption;
  index: number;
  count: number;
  currency: ProposalContent["currency"];
  depositPercent: number;
  onChange: (o: ProposalOption) => void;
  onRemove: () => void;
  onRecommend: () => void;
}) {
  const set = <K extends keyof ProposalOption>(k: K, v: ProposalOption[K]) => onChange({ ...o, [k]: v });
  const { depositMinor } = split(o.priceMinor, depositPercent);
  const days = optionDays(o);
  return (
    <div className={`desk-option${o.recommended ? " is-rec" : ""}`}>
      <div className="desk-row-head">
        <span className="field__label">Option {index + 1}</span>
        <span className="desk-tools">
          <label className="desk-inline">
            <input type="radio" name="recommended" checked={o.recommended} onChange={onRecommend} /> Recommended
          </label>
          {count > 1 ? (
            <button type="button" className="text-link" onClick={onRemove}>
              Remove option
            </button>
          ) : null}
        </span>
      </div>
      <div className="desk-two">
        <Field label="Name">
          <input className="field__input" placeholder="e.g. Essential" value={o.name} onChange={(e) => set("name", e.target.value)} />
        </Field>
        <MoneyInput label="Price" value={o.priceMinor} currency={currency} onChange={(v) => set("priceMinor", v)} />
      </div>
      <Field label="One-line summary">
        <input className="field__input" placeholder="Who it’s for, in a sentence" value={o.summary} onChange={(e) => set("summary", e.target.value)} />
      </Field>

      <div className="field">
        <span className="field__label">Deliverables</span>
        {o.deliverables.map((d, i) => (
          <div key={i} className="desk-subrow">
            <div className="desk-row-head">
              <input className="field__input" placeholder="Deliverable" value={d.title} onChange={(e) => set("deliverables", o.deliverables.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
              <RowTools
                onUp={() => set("deliverables", move(o.deliverables, i, -1))}
                onDown={() => set("deliverables", move(o.deliverables, i, 1))}
                onRemove={() => set("deliverables", o.deliverables.filter((_, j) => j !== i))}
              />
            </div>
            <div className="desk-two">
              <input className="field__input" placeholder="Format, e.g. live site on your domain" value={d.format} onChange={(e) => set("deliverables", o.deliverables.map((x, j) => (j === i ? { ...x, format: e.target.value } : x)))} />
              <input className="field__input" placeholder="Details (optional)" value={d.description} onChange={(e) => set("deliverables", o.deliverables.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))} />
            </div>
          </div>
        ))}
        <div className="actions">
          <button type="button" className="button button--pale" onClick={() => set("deliverables", [...o.deliverables, { title: "", description: "", format: "" }])}>
            Add deliverable
          </button>
        </div>
      </div>

      <div className="field">
        <span className="field__label">Timeline (working days from the deposit)</span>
        {o.timeline.map((t, i) => (
          <div key={i} className="desk-row-head">
            <input
              className="field__input desk-day"
              inputMode="numeric"
              placeholder="Day"
              aria-label="Working day"
              value={t.day ?? ""}
              onChange={(e) => {
                const n = e.target.value.trim() === "" ? null : Number.parseInt(e.target.value, 10);
                set("timeline", o.timeline.map((x, j) => (j === i ? { ...x, day: Number.isFinite(n) ? n : null } : x)));
              }}
            />
            <input className="field__input" placeholder="Milestone, e.g. Design approved" value={t.title} onChange={(e) => set("timeline", o.timeline.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} />
            <RowTools
              onUp={() => set("timeline", move(o.timeline, i, -1))}
              onDown={() => set("timeline", move(o.timeline, i, 1))}
              onRemove={() => set("timeline", o.timeline.filter((_, j) => j !== i))}
            />
          </div>
        ))}
        <div className="actions">
          <button type="button" className="button button--pale" onClick={() => set("timeline", [...o.timeline, { title: "", day: null }])}>
            Add milestone
          </button>
          <span className="field__hint">
            {formatMoney(depositMinor, currency)} deposit{days ? ` · ${days} working days` : ""}
          </span>
        </div>
      </div>
    </div>
  );
}

export function ProposalEditor(props: {
  id: string;
  initial: ProposalContent;
  status: Status;
  version: number;
  unsent: boolean;
  hasPasscode: boolean;
  expiresAt: string | null;
  acceptedAt: string | null;
  link: string | null;
  logoUrl: string | null;
  discoveryUrl: string | null;
  catalog: CatalogEntry[];
  contracts: { slug: string; name: string; body: string }[];
  tags: { value: string; label: string }[];
  providerName: string;
  signatures: Sig[];
  invoices: DeskInvoice[];
  businessReady: boolean;
  views: { at: string; version: number; userAgent: string | null }[];
}) {
  const { id, status } = props;
  const editable = isEditable(status);
  const [c, setC] = useState<ProposalContent>(props.initial);
  const [saved, setSaved] = useState<ProposalContent>(props.initial);
  const [logoUrl, setLogoUrl] = useState(props.logoUrl);
  const [lateFee, setLateFee] = useState(bpsLabel(props.initial.terms.lateFeeBps).replace("%", ""));
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);

  const set = <K extends keyof ProposalContent>(k: K, v: ProposalContent[K]) => setC((prev) => ({ ...prev, [k]: v }));
  const setTerm = <K extends keyof ProposalContent["terms"]>(k: K, v: number) => setC((prev) => ({ ...prev, terms: { ...prev.terms, [k]: v } }));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = useCallback(() => {
    const snapshot = c;
    start(async () => {
      const r = await saveAction(id, snapshot);
      if (r.ok) {
        setSaved(snapshot);
        setMsg({ kind: "ok", text: "Saved." });
      } else setMsg({ kind: "error", text: r.error });
    });
  }, [c, id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        if (editable && dirty) save();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [dirty, editable, save]);

  // ---------- Relevant work ----------
  const byKey = useMemo(() => new Map(props.catalog.map((w) => [w.key, w])), [props.catalog]);
  const suggested = useMemo(() => {
    const picked = new Set(c.work.map((w) => w.key));
    return rankWork(props.catalog, c.tags).filter((r) => !picked.has(r.item.key));
  }, [props.catalog, c.tags, c.work]);
  const others = props.catalog.filter((w) => !c.work.some((p) => p.key === w.key) && !suggested.some((s) => s.item.key === w.key));

  // ---------- Contract ----------
  const unknownMarkers = placeholders(c.contractBody).filter((p) => !KNOWN.has(p));
  const pickTemplate = (slug: string) => {
    const t = props.contracts.find((x) => x.slug === slug);
    if (!t) return;
    if (c.contractBody.trim() && c.contractBody !== t.body && !confirm("Replace the current contract text with this template?")) return;
    setC((prev) => ({ ...prev, contractTemplate: slug, contractBody: t.body }));
  };

  async function uploadLogo(file: File) {
    const body = new FormData();
    body.append("file", file);
    const res = await fetch(`/api/desk/${id}/logo`, { method: "POST", body });
    const data = (await res.json().catch(() => ({}))) as { key?: string; error?: string };
    if (!res.ok || !data.key) return setMsg({ kind: "error", text: data.error ?? "Upload failed." });
    set("clientLogoKey", data.key);
    setLogoUrl(URL.createObjectURL(file));
    setMsg({ kind: "ok", text: "Logo uploaded. Save to keep it." });
  }

  const problems = readiness(c);
  const lock = !editable;
  const setOption = (i: number, o: ProposalOption) => set("options", c.options.map((x, j) => (j === i ? o : x)));

  return (
    <div className="desk-grid">
      <div className="desk-main">
        <fieldset disabled={lock} className="desk-fieldset">
          <Panel title="Client">
            <div className="pp-fields">
              <Field label="Client name" hint="The business or organisation.">
                <input className="field__input" value={c.clientName} onChange={(e) => set("clientName", e.target.value)} />
              </Field>
              <Field label="Contact name" hint="The person who will sign.">
                <input className="field__input" value={c.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </Field>
              <Field label="Contact email" hint="Pre-filled on the signing form, and used for invoices.">
                <input className="field__input" type="email" value={c.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              </Field>
            </div>
            <div className="desk-logo">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="" className="pp-logo" />
              ) : (
                <span className="pp-logo pp-logo--initials">{c.clientName.slice(0, 2).toUpperCase() || "?"}</span>
              )}
              <label className="button button--pale">
                {c.clientLogoKey ? "Replace logo" : "Upload logo"}
                <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])} />
              </label>
              {c.clientLogoKey ? (
                <button
                  type="button"
                  className="text-link"
                  onClick={() => {
                    set("clientLogoKey", null);
                    setLogoUrl(null);
                  }}
                >
                  Remove
                </button>
              ) : null}
              <span className="field__hint">PNG, JPEG or WebP, up to 2 MB. Square works best.</span>
            </div>
            {props.discoveryUrl ? (
              <p className="m-0 field__hint">
                Started from{" "}
                <a href={props.discoveryUrl} className="text-link">
                  discovery notes
                </a>
                .
              </p>
            ) : null}
          </Panel>

          <Panel title="Part one: in their words" sub="The proposal opens with the client’s own description of the problem.">
            <Field label="Intro" hint="A short personal note at the top. Blank lines start new paragraphs.">
              <textarea className="field__input field__area" rows={3} value={c.intro} onChange={(e) => set("intro", e.target.value)} />
            </Field>
            <Field label="In your words" hint="Quote what they told you (discovery question 2). Their words, not yours.">
              <textarea className="field__input field__area" rows={5} value={c.brief} onChange={(e) => set("brief", e.target.value)} />
            </Field>
            <div className="field">
              <span className="field__label">Objectives</span>
              <span className="field__hint">The measurable result you both agree on, e.g. “Cut missed orders from about 20 a week to under 2.”</span>
              <TextList items={c.objectives} onChange={(v) => set("objectives", v)} placeholder="A measurable result" add="Add objective" />
            </div>
            <div className="field">
              <span className="field__label">Kind of work</span>
              <div className="chips" role="group" aria-label="Kind of work">
                {props.tags.map((t) => {
                  const on = c.tags.includes(t.value);
                  return (
                    <button key={t.value} type="button" aria-pressed={on} className={`chip desk-chip${on ? " is-on" : ""}`} onClick={() => set("tags", on ? c.tags.filter((x) => x !== t.value) : [...c.tags, t.value])}>
                      {t.label}
                    </button>
                  );
                })}
              </div>
              <span className="field__hint">Used to suggest relevant work below.</span>
            </div>
          </Panel>

          <Panel title="Relevant work" sub="Shown in this order. Add a line on why each one matters to this client.">
            {c.work.length ? (
              <ul className="list">
                {c.work.map((w, i) => {
                  const item = byKey.get(w.key);
                  return (
                    <li key={w.key} className="list__item">
                      <span className="desk-row-head">
                        <span className="medium">{item?.name ?? `${w.key} (removed from the site)`}</span>
                        <RowTools onUp={() => set("work", move(c.work, i, -1))} onDown={() => set("work", move(c.work, i, 1))} onRemove={() => set("work", c.work.filter((_, j) => j !== i))} />
                      </span>
                      <input className="field__input" placeholder={item?.summary ?? "Why this is relevant"} value={w.note} onChange={(e) => set("work", c.work.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))} />
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="m-0 muted">Nothing picked yet.</p>
            )}
            {suggested.length ? (
              <div className="field">
                <span className="field__label">Suggested from the tags</span>
                <div className="chips">
                  {suggested.map(({ item, shared }) => (
                    <button key={item.key} type="button" className="chip desk-chip" onClick={() => set("work", [...c.work, { key: item.key, note: "" }])}>
                      + {item.name} <span className="faint">· {shared}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
            {others.length ? (
              <div className="field">
                <span className="field__label">Everything else</span>
                <div className="chips">
                  {others.map((item) => (
                    <button key={item.key} type="button" className="chip desk-chip" onClick={() => set("work", [...c.work, { key: item.key, note: "" }])}>
                      + {item.name}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </Panel>

          <Panel title="Options" sub="Up to three. The client picks one, and the agreement follows their choice. Each is its own scope, timeline and price.">
            <Field label="Currency">
              <select className="field__input" value={c.currency} onChange={(e) => set("currency", e.target.value as ProposalContent["currency"])}>
                <option value="NGN">Naira (₦)</option>
                <option value="USD">US dollars ($)</option>
              </select>
            </Field>
            <div className="desk-options">
              {c.options.map((o, i) => (
                <OptionEditor
                  key={o.id}
                  o={o}
                  index={i}
                  count={c.options.length}
                  currency={c.currency}
                  depositPercent={c.terms.depositPercent}
                  onChange={(next) => setOption(i, next)}
                  onRemove={() => set("options", c.options.filter((_, j) => j !== i))}
                  onRecommend={() => set("options", c.options.map((x, j) => ({ ...x, recommended: j === i })))}
                />
              ))}
            </div>
            {c.options.length < 3 ? (
              <div className="actions">
                <button type="button" className="button button--pale" onClick={() => set("options", [...c.options, emptyOption()])}>
                  Add option
                </button>
              </div>
            ) : null}
          </Panel>

          <Panel title="Scope: out" sub="The list that protects you. Required before sending.">
            <TextList items={c.outOfScope} onChange={(v) => set("outOfScope", v)} placeholder="e.g. Mobile apps for iOS or Android" add="Add exclusion" />
          </Panel>

          <Panel title="Client responsibilities" sub="What they must supply, and by when.">
            {c.responsibilities.length ? (
              <ul className="desk-lines">
                {c.responsibilities.map((r, i) => (
                  <li key={i} className="desk-row-head">
                    <input className="field__input" placeholder="e.g. Product photos and prices" value={r.item} onChange={(e) => set("responsibilities", c.responsibilities.map((x, j) => (j === i ? { ...x, item: e.target.value } : x)))} />
                    <input className="field__input desk-by" placeholder="By, e.g. day 3" value={r.by} onChange={(e) => set("responsibilities", c.responsibilities.map((x, j) => (j === i ? { ...x, by: e.target.value } : x)))} />
                    <RowTools
                      onUp={() => set("responsibilities", move(c.responsibilities, i, -1))}
                      onDown={() => set("responsibilities", move(c.responsibilities, i, 1))}
                      onRemove={() => set("responsibilities", c.responsibilities.filter((_, j) => j !== i))}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="actions">
              <button type="button" className="button button--pale" onClick={() => set("responsibilities", [...c.responsibilities, { item: "", by: "" }])}>
                Add responsibility
              </button>
            </div>
          </Panel>

          <Panel title="Acceptance criteria" sub="How you’ll both agree it is finished. Acceptance triggers the balance invoice.">
            <TextList items={c.acceptance} onChange={(v) => set("acceptance", v)} placeholder="e.g. A shop owner can place and pay for an order on a phone" add="Add criterion" />
          </Panel>

          <Panel title="Payment terms" sub="No deposit, no start. Defaults come from Studio → Proposal defaults.">
            <div className="desk-two">
              <Field label="Deposit (%)" hint="Paid before any work begins.">
                <input className="field__input" inputMode="numeric" value={c.terms.depositPercent} onChange={(e) => setTerm("depositPercent", Math.min(100, Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0)))} />
              </Field>
              <Field label="Deposit due (days after signing)">
                <input className="field__input" inputMode="numeric" value={c.terms.depositDueDays} onChange={(e) => setTerm("depositDueDays", Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0))} />
              </Field>
              <Field label="Balance due (days after acceptance)">
                <input className="field__input" inputMode="numeric" value={c.terms.balanceDueDays} onChange={(e) => setTerm("balanceDueDays", Math.max(0, Number.parseInt(e.target.value || "0", 10) || 0))} />
              </Field>
              <Field label="Late fee (% per month)" hint={/^\d{1,2}(\.\d{1,2})?$/.test(lateFee.trim()) ? `${lateFee.trim()}% a month` : "Use a number like 1.5"}>
                <input
                  className="field__input"
                  inputMode="decimal"
                  value={lateFee}
                  onChange={(e) => {
                    setLateFee(e.target.value);
                    const m = /^(\d{1,2})(?:\.(\d{1,2}))?$/.exec(e.target.value.trim());
                    if (m) setTerm("lateFeeBps", Number(m[1]) * 100 + Number((m[2] ?? "").padEnd(2, "0")));
                  }}
                />
              </Field>
              <Field label="Pause work after (working days late)">
                <input className="field__input" inputMode="numeric" value={c.terms.stopWorkDays} onChange={(e) => setTerm("stopWorkDays", Math.max(1, Number.parseInt(e.target.value || "1", 10) || 1))} />
              </Field>
            </div>
          </Panel>

          <Panel title="Agreement" sub="Placeholders like {{overview}} and {{payment}} are filled in for each option when you send.">
            <Field label="Template">
              <select className="field__input" value={c.contractTemplate ?? ""} onChange={(e) => pickTemplate(e.target.value)}>
                <option value="" disabled>
                  Pick a template
                </option>
                {props.contracts.map((t) => (
                  <option key={t.slug} value={t.slug}>
                    {t.name}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Terms for this client" hint="Edit freely; the template in Studio stays as it is. Lines starting with # are headings, - starts a list item.">
              <textarea className="field__input field__area field__mono" rows={18} value={c.contractBody} onChange={(e) => set("contractBody", e.target.value)} />
            </Field>
            {unknownMarkers.length ? <p className="pp-error m-0">Unknown placeholders, left as typed: {unknownMarkers.map((m) => `{{${m}}}`).join(", ")}</p> : null}
          </Panel>
        </fieldset>
      </div>

      <aside className="desk-side">
        <div className="desk-sticky">
          <Panel title={props.acceptedAt ? "Accepted" : STATUS_LABEL[status]} sub={props.version ? `Version ${props.version} is with the client.` : "Not sent yet."}>
            {editable ? (
              <div className="actions">
                <button type="button" className="button" onClick={save} disabled={!dirty || pending}>
                  {pending ? "Saving…" : dirty ? "Save" : "Saved"}
                </button>
                <a href={`/desk/${id}/preview`} className="text-link" target="_blank" rel="noreferrer">
                  Preview
                </a>
                <a href={`/api/desk/${id}/pdf`} className="text-link" target="_blank" rel="noreferrer">
                  PDF
                </a>
              </div>
            ) : null}
            {msg ? (
              <p className={msg.kind === "error" ? "pp-error m-0" : "m-0 muted"} role="status">
                {msg.text}
              </p>
            ) : null}
            {props.link ? <CopyLink link={props.link} label="Client link" /> : null}
            {props.expiresAt && status !== "signed" ? <p className="m-0 muted text-[14px]">Valid until {fmt(props.expiresAt)}</p> : null}
          </Panel>

          {editable ? (
            <SendPanel id={id} providerName={props.providerName} disabled={dirty || problems.length > 0} problems={dirty ? ["Save your changes first."] : problems} resend={props.version > 0} unsent={props.unsent} />
          ) : null}

          {status === "signed" ? <InvoicesPanel id={id} invoices={props.invoices} accepted={Boolean(props.acceptedAt)} businessReady={props.businessReady} /> : null}

          <Panel title="More">
            <div className="desk-more">
              {editable && props.version > 0 ? (
                <>
                  <form action={extendAction.bind(null, id, 7)}>
                    <button type="submit" className="text-link">
                      Extend by 7 days
                    </button>
                  </form>
                  <PasscodeControl id={id} has={props.hasPasscode} />
                </>
              ) : null}
              <form action={duplicateAction.bind(null, id)}>
                <button type="submit" className="text-link">
                  Duplicate for another client
                </button>
              </form>
              {editable && props.version > 0 ? (
                <form
                  action={withdrawAction.bind(null, id)}
                  onSubmit={(e) => {
                    if (!confirm("Withdraw this proposal? The link will stop working.")) e.preventDefault();
                  }}
                >
                  <button type="submit" className="text-link">
                    Withdraw
                  </button>
                </form>
              ) : null}
              {status === "draft" && props.version === 0 ? (
                <form
                  action={deleteAction.bind(null, id)}
                  onSubmit={(e) => {
                    if (!confirm("Delete this draft?")) e.preventDefault();
                  }}
                >
                  <button type="submit" className="text-link">
                    Delete draft
                  </button>
                </form>
              ) : null}
            </div>
          </Panel>

          {props.signatures.length ? (
            <Panel title="Signatures">
              <ul className="desk-sigs">
                {props.signatures.map((s) => (
                  <li key={s.id}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={s.imageUrl} alt="" className="desk-sig-img" />
                    <span className="medium">
                      {s.name} <span className="faint">· {s.role === "client" ? "client" : "you"}, v{s.version}</span>
                    </span>
                    {s.optionName ? <span className="muted text-[14px]">Chose {s.optionName}</span> : null}
                    <span className="muted text-[14px]">
                      {fmt(s.signedAt)}
                      {s.ip ? ` · ${s.ip}` : ""}
                    </span>
                    <span className="faint desk-hash">{s.contentSha256}</span>
                    {s.pdfUrl ? (
                      <a href={s.pdfUrl} className="text-link">
                        Signed PDF
                      </a>
                    ) : null}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}

          {props.views.length ? (
            <Panel title="Recent views">
              <ul className="desk-views">
                {props.views.map((v, i) => (
                  <li key={i} className="muted text-[14px]">
                    {fmt(v.at)} · v{v.version}
                    {v.userAgent ? ` · ${/Mobile|Android|iPhone/.test(v.userAgent) ? "phone" : "desktop"}` : ""}
                  </li>
                ))}
              </ul>
            </Panel>
          ) : null}
        </div>
      </aside>
    </div>
  );
}

function InvoicesPanel({ id, invoices, accepted, businessReady }: { id: string; invoices: DeskInvoice[]; accepted: boolean; businessReady: boolean }) {
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const hasDeposit = invoices.some((i) => i.kind === "deposit");
  return (
    <Panel title="Invoices" sub={accepted ? "Work accepted. The balance invoice is issued." : "Mark the work accepted when the acceptance criteria are met, to issue the balance invoice."}>
      {!businessReady ? (
        <p className="m-0 pp-error">
          Add your bank details in{" "}
          <Link href="/desk/settings" className="text-link">
            Settings
          </Link>{" "}
          so invoices show how to pay.
        </p>
      ) : null}
      {invoices.length ? (
        <ul className="desk-sigs">
          {invoices.map((inv) => (
            <li key={inv.id}>
              <span className="medium">
                {inv.number} · {inv.kind === "deposit" ? "Deposit" : "Balance"} · {formatMoney(inv.amountMinor, inv.currency)}
              </span>
              <span className={inv.state === "overdue" ? "pp-error" : "muted text-[14px]"}>
                {inv.state === "paid"
                  ? `Paid ${inv.paidAt ? fmtDay(inv.paidAt) : ""}${inv.paidVia ? ` by ${inv.paidVia === "paystack" ? "Paystack" : "transfer"}` : ""}`
                  : inv.state === "void"
                    ? "Cancelled"
                    : `${inv.state === "overdue" ? "Overdue" : "Due"} ${fmtDay(inv.dueAt)}${inv.daysLate ? ` · ${inv.daysLate} working days late` : ""}`}
              </span>
              {inv.state === "overdue" && inv.daysLate >= 10 ? <span className="pp-error">Payment is 10+ working days late: pause the work, as the agreement allows.</span> : null}
              {inv.state !== "void" ? <CopyLink link={inv.url} label={`Invoice ${inv.number} link`} /> : null}
              {inv.state === "unpaid" || inv.state === "overdue" ? (
                <span className="desk-inline">
                  <form action={markPaidAction.bind(null, inv.id)} onSubmit={(e) => { if (!confirm(`Mark invoice ${inv.number} as paid by bank transfer?`)) e.preventDefault(); }}>
                    <button type="submit" className="text-link">
                      Mark paid (transfer)
                    </button>
                  </form>
                  <form action={voidInvoiceAction.bind(null, inv.id)} onSubmit={(e) => { if (!confirm(`Cancel invoice ${inv.number}?`)) e.preventDefault(); }}>
                    <button type="submit" className="text-link">
                      Cancel
                    </button>
                  </form>
                </span>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="m-0 muted">No invoices yet.</p>
      )}
      {err ? <p className="pp-error m-0">{err}</p> : null}
      <div className="actions">
        {!hasDeposit ? (
          <button type="button" className="button button--pale" disabled={pending} onClick={() => start(async () => { const r = await issueDepositAction(id); setErr(r.ok ? null : r.error); })}>
            Issue deposit invoice
          </button>
        ) : null}
        {!accepted ? (
          <button
            type="button"
            className="button"
            disabled={pending}
            onClick={() => {
              if (!confirm("Mark the work accepted? This issues the balance invoice.")) return;
              start(async () => {
                const r = await acceptWorkAction(id);
                setErr(r.ok ? null : r.error);
              });
            }}
          >
            Mark work accepted
          </button>
        ) : null}
      </div>
    </Panel>
  );
}

function CopyLink({ link, label }: { link: string; label: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="desk-link">
      <input className="field__input field__mono" value={link} readOnly onFocus={(e) => e.currentTarget.select()} aria-label={label} />
      <div className="actions">
        <button
          type="button"
          className="button button--pale"
          onClick={async () => {
            await navigator.clipboard.writeText(link);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
          }}
        >
          {copied ? "Copied" : "Copy link"}
        </button>
        <a href={link} className="text-link" target="_blank" rel="noreferrer">
          Open
        </a>
      </div>
    </div>
  );
}

function PasscodeControl({ id, has }: { id: string; has: boolean }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  if (!open) {
    return (
      <span className="desk-inline">
        <button type="button" className="text-link" onClick={() => setOpen(true)}>
          {has ? "Change passcode" : "Add a passcode"}
        </button>
        {has ? (
          <button type="button" className="text-link" disabled={pending} onClick={() => start(async () => void (await passcodeAction(id, null)))}>
            Remove passcode
          </button>
        ) : null}
      </span>
    );
  }
  return (
    <form
      className="desk-inline"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await passcodeAction(id, value);
          if (r.ok) {
            setOpen(false);
            setValue("");
            setErr(null);
          } else setErr(r.error);
        });
      }}
    >
      <input className="field__input" value={value} onChange={(e) => setValue(e.target.value)} placeholder="Passcode" aria-label="Passcode" autoFocus />
      <button type="submit" className="button button--pale" disabled={pending}>
        Set
      </button>
      {err ? <span className="pp-error">{err}</span> : <span className="field__hint">Send it to the client separately from the link.</span>}
    </form>
  );
}

function SendPanel({ id, providerName, disabled, problems, resend, unsent }: { id: string; providerName: string; disabled: boolean; problems: string[]; resend: boolean; unsent: boolean }) {
  const pad = useRef<SignaturePadHandle>(null);
  const [sig, setSig] = useState<{ method: SignatureMethod; ready: boolean }>({ method: "typed", ready: true });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onPad = useCallback((s: { method: SignatureMethod; ready: boolean }) => setSig(s), []);

  if (resend && !unsent && !disabled) {
    return (
      <Panel title="Up to date" sub="The client sees your latest saved version. Edit and save to send an update.">
        <span />
      </Panel>
    );
  }

  return (
    <Panel
      title={resend ? "Send update" : "Sign and send"}
      sub={resend ? "Publishes your saved changes as a new version. The client signs the new one." : "Your signature goes on the proposal and the private link starts working."}
    >
      <SignaturePad ref={pad} name={providerName} onChange={onPad} />
      {problems.length ? (
        <ul className="desk-problems">
          {problems.map((p) => (
            <li key={p}>{p}</li>
          ))}
        </ul>
      ) : null}
      {err ? <p className="pp-error m-0">{err}</p> : null}
      <div className="actions">
        <button
          type="button"
          className="button"
          disabled={disabled || !sig.ready || pending}
          onClick={() =>
            start(async () => {
              const image = await pad.current?.toDataUrl();
              if (!image) return setErr("Add your signature first.");
              const r = await sendAction(id, image);
              setErr(r.ok ? null : r.error);
            })
          }
        >
          {pending ? "Sending…" : resend ? "Send update" : "Sign and send"}
        </button>
      </div>
    </Panel>
  );
}
