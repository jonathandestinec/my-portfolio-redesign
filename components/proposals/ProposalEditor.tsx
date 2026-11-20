"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  deleteAction,
  duplicateAction,
  extendAction,
  passcodeAction,
  saveAction,
  sendAction,
  withdrawAction,
} from "@/app/desk/actions";
import { rankWork } from "@/lib/proposals/match";
import { amountInput, formatMoney, parseAmount, totalMinor } from "@/lib/proposals/money";
import { readiness } from "@/lib/proposals/snapshot";
import { STATUS_LABEL, isEditable } from "@/lib/proposals/status";
import { placeholders } from "@/lib/proposals/template";
import type { ProposalContent, Status } from "@/lib/proposals/types";
import { SignaturePad, type SignatureMethod, type SignaturePadHandle } from "./SignaturePad";

const KNOWN = new Set(["client", "contact", "provider", "providerTitle", "total", "currency", "date", "validUntil", "scope", "milestones"]);

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
};

const fmt = (iso: string) =>
  new Intl.DateTimeFormat("en-GB", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit", timeZone: "Africa/Lagos", timeZoneName: "short" }).format(new Date(iso));

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

function Panel({ title, sub, children }: { title: string; sub?: string; children: React.ReactNode }) {
  return (
    <section className="card">
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

export function ProposalEditor(props: {
  id: string;
  initial: ProposalContent;
  status: Status;
  version: number;
  unsent: boolean;
  hasPasscode: boolean;
  expiresAt: string | null;
  link: string | null;
  logoUrl: string | null;
  catalog: CatalogEntry[];
  contracts: { slug: string; name: string; body: string }[];
  tags: { value: string; label: string }[];
  providerName: string;
  signatures: Sig[];
  views: { at: string; version: number; userAgent: string | null }[];
}) {
  const { id, status } = props;
  const editable = isEditable(status);
  const [c, setC] = useState<ProposalContent>(props.initial);
  const [saved, setSaved] = useState<ProposalContent>(props.initial);
  const [amounts, setAmounts] = useState<string[]>(props.initial.milestones.map((m) => amountInput(m.amountMinor)));
  const [logoUrl, setLogoUrl] = useState(props.logoUrl);
  const [msg, setMsg] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify(c) !== JSON.stringify(saved);

  const set = <K extends keyof ProposalContent>(k: K, v: ProposalContent[K]) => setC((prev) => ({ ...prev, [k]: v }));

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

  // ---------- Money ----------
  const total = (() => {
    try {
      return totalMinor(c.milestones);
    } catch {
      return 0;
    }
  })();
  const setAmount = (i: number, text: string) => {
    const next = [...amounts];
    next[i] = text;
    setAmounts(next);
    const parsed = parseAmount(text);
    set(
      "milestones",
      c.milestones.map((m, j) => (j === i ? { ...m, amountMinor: parsed ?? 0 } : m)),
    );
  };

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

  return (
    <div className="desk-grid">
      <div className="desk-main">
        <fieldset disabled={lock} className="desk-fieldset">
          <Panel title="Client">
            <div className="pp-fields">
              <Field label="Client name">
                <input className="field__input" value={c.clientName} onChange={(e) => set("clientName", e.target.value)} />
              </Field>
              <Field label="Contact name">
                <input className="field__input" value={c.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </Field>
              <Field label="Contact email" hint="Pre-filled on the signing form. Not emailed in this version.">
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
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  className="sr-only"
                  onChange={(e) => e.target.files?.[0] && uploadLogo(e.target.files[0])}
                />
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
          </Panel>

          <Panel title="Intro and brief">
            <Field label="Intro" hint="A short personal note at the top. Blank lines start new paragraphs.">
              <textarea className="field__input field__area" rows={4} value={c.intro} onChange={(e) => set("intro", e.target.value)} />
            </Field>
            <Field label="What they need" hint="The brief, in your words.">
              <textarea className="field__input field__area" rows={6} value={c.brief} onChange={(e) => set("brief", e.target.value)} />
            </Field>
            <div className="field">
              <span className="field__label">Kind of work</span>
              <div className="chips" role="group" aria-label="Kind of work">
                {props.tags.map((t) => {
                  const on = c.tags.includes(t.value);
                  return (
                    <button
                      key={t.value}
                      type="button"
                      aria-pressed={on}
                      className={`chip desk-chip${on ? " is-on" : ""}`}
                      onClick={() => set("tags", on ? c.tags.filter((x) => x !== t.value) : [...c.tags, t.value])}
                    >
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
                        <RowTools
                          onUp={() => set("work", move(c.work, i, -1))}
                          onDown={() => set("work", move(c.work, i, 1))}
                          onRemove={() => set("work", c.work.filter((_, j) => j !== i))}
                        />
                      </span>
                      <input
                        className="field__input"
                        placeholder={item?.summary ?? "Why this is relevant"}
                        value={w.note}
                        onChange={(e) => set("work", c.work.map((x, j) => (j === i ? { ...x, note: e.target.value } : x)))}
                      />
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

          <Panel title="Scope" sub="The deliverables, one per row.">
            {c.scope.length ? (
              <ul className="list">
                {c.scope.map((s, i) => (
                  <li key={i} className="list__item">
                    <span className="desk-row-head">
                      <input
                        className="field__input"
                        placeholder="Deliverable"
                        value={s.title}
                        onChange={(e) => set("scope", c.scope.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                      />
                      <RowTools
                        onUp={() => set("scope", move(c.scope, i, -1))}
                        onDown={() => set("scope", move(c.scope, i, 1))}
                        onRemove={() => set("scope", c.scope.filter((_, j) => j !== i))}
                      />
                    </span>
                    <textarea
                      className="field__input field__area"
                      rows={2}
                      placeholder="Details (optional)"
                      value={s.description}
                      onChange={(e) => set("scope", c.scope.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                    />
                  </li>
                ))}
              </ul>
            ) : null}
            <div className="actions">
              <button type="button" className="button button--pale" onClick={() => set("scope", [...c.scope, { title: "", description: "" }])}>
                Add deliverable
              </button>
            </div>
          </Panel>

          <Panel title="Milestones and price">
            <Field label="Currency">
              <select className="field__input" value={c.currency} onChange={(e) => set("currency", e.target.value as ProposalContent["currency"])}>
                <option value="NGN">Naira (₦)</option>
                <option value="USD">US dollars ($)</option>
              </select>
            </Field>
            {c.milestones.length ? (
              <ul className="list">
                {c.milestones.map((m, i) => {
                  const bad = amounts[i] !== undefined && amounts[i].trim() !== "" && parseAmount(amounts[i]) === null;
                  return (
                    <li key={i} className="list__item">
                      <span className="desk-row-head">
                        <input
                          className="field__input"
                          placeholder="Milestone"
                          value={m.title}
                          onChange={(e) => set("milestones", c.milestones.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))}
                        />
                        <RowTools
                          onUp={() => {
                            set("milestones", move(c.milestones, i, -1));
                            setAmounts(move(amounts, i, -1));
                          }}
                          onDown={() => {
                            set("milestones", move(c.milestones, i, 1));
                            setAmounts(move(amounts, i, 1));
                          }}
                          onRemove={() => {
                            set("milestones", c.milestones.filter((_, j) => j !== i));
                            setAmounts(amounts.filter((_, j) => j !== i));
                          }}
                        />
                      </span>
                      <div className="desk-two">
                        <Field label="Amount" hint={bad ? "Use a number like 150,000 or 1500.50" : formatMoney(m.amountMinor, c.currency)}>
                          <input className="field__input" inputMode="decimal" value={amounts[i] ?? ""} aria-invalid={bad} onChange={(e) => setAmount(i, e.target.value)} />
                        </Field>
                        <Field label="Due">
                          <input
                            className="field__input"
                            placeholder="e.g. Week 2"
                            value={m.due}
                            onChange={(e) => set("milestones", c.milestones.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)))}
                          />
                        </Field>
                      </div>
                      <textarea
                        className="field__input field__area"
                        rows={2}
                        placeholder="What’s delivered (optional)"
                        value={m.description}
                        onChange={(e) => set("milestones", c.milestones.map((x, j) => (j === i ? { ...x, description: e.target.value } : x)))}
                      />
                    </li>
                  );
                })}
              </ul>
            ) : null}
            <div className="actions">
              <button
                type="button"
                className="button button--pale"
                onClick={() => {
                  set("milestones", [...c.milestones, { title: "", description: "", amountMinor: 0, due: "" }]);
                  setAmounts([...amounts, ""]);
                }}
              >
                Add milestone
              </button>
              <span className="medium">Total {formatMoney(total, c.currency)}</span>
            </div>
          </Panel>

          <Panel title="Contract" sub="Placeholders like {{client}} and {{total}} are filled in when you send.">
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
            {unknownMarkers.length ? (
              <p className="pp-error m-0">Unknown placeholders, left as typed: {unknownMarkers.map((m) => `{{${m}}}`).join(", ")}</p>
            ) : null}
          </Panel>
        </fieldset>
      </div>

      <aside className="desk-side">
        <div className="desk-sticky">
          <Panel title={STATUS_LABEL[status]} sub={props.version ? `Version ${props.version} is with the client.` : "Not sent yet."}>
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
            {props.link ? <CopyLink link={props.link} /> : null}
            {props.expiresAt && status !== "signed" ? (
              <p className="m-0 muted text-[14px]">Valid until {fmt(props.expiresAt)}</p>
            ) : null}
          </Panel>

          {editable ? (
            <SendPanel
              id={id}
              providerName={props.providerName}
              disabled={dirty || problems.length > 0}
              problems={dirty ? ["Save your changes first."] : problems}
              resend={props.version > 0}
              unsent={props.unsent}
            />
          ) : null}

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

function CopyLink({ link }: { link: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="desk-link">
      <input className="field__input field__mono" value={link} readOnly onFocus={(e) => e.currentTarget.select()} aria-label="Client link" />
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

function SendPanel({
  id,
  providerName,
  disabled,
  problems,
  resend,
  unsent,
}: {
  id: string;
  providerName: string;
  disabled: boolean;
  problems: string[];
  resend: boolean;
  unsent: boolean;
}) {
  const pad = useRef<SignaturePadHandle>(null);
  const [sig, setSig] = useState<{ method: SignatureMethod; ready: boolean }>({ method: "typed", ready: true });
  const [err, setErr] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const onPad = useCallback((s: { method: SignatureMethod; ready: boolean }) => setSig(s), []);

  if (resend && !unsent && !disabled) {
    return (
      <Panel title="Up to date" sub="The client sees your latest saved version. Edit and save to send an update." >
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
