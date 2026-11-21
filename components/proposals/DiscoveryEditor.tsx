"use client";

import { useEffect, useState, useTransition } from "react";
import { deleteDiscoveryAction, proposalFromDiscoveryAction, saveDiscoveryAction } from "@/app/desk/actions";
import { DISCOVERY_QUESTIONS, type DiscoveryNotes } from "@/lib/proposals/discovery-types";

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
    </label>
  );
}

/** Notes from one market-survey conversation: five questions, no pitch, no price. */
export function DiscoveryEditor({ id, initialBusiness, initial, proposalUrl }: { id: string; initialBusiness: string; initial: DiscoveryNotes; proposalUrl: string | null }) {
  const [business, setBusiness] = useState(initialBusiness);
  const [n, setN] = useState(initial);
  const [saved, setSaved] = useState(JSON.stringify([initialBusiness, initial]));
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  const dirty = JSON.stringify([business, n]) !== saved;
  const set = <K extends keyof DiscoveryNotes>(k: K, v: DiscoveryNotes[K]) => setN((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  const save = () =>
    start(async () => {
      const r = await saveDiscoveryAction(id, business, n);
      if (r.ok) {
        setSaved(JSON.stringify([business, n]));
        setMsg("Saved.");
      } else setMsg(r.error);
    });

  return (
    <div className="desk-grid">
      <div className="desk-main">
        <section className="card">
          <div className="card__body">
            <div className="section__head">
              <h2 className="section__title">The business</h2>
              <p className="section__sub">Under an hour. No laptop, no pitch, no price.</p>
            </div>
            <div className="pp-fields">
              <Field label="Business name">
                <input className="field__input" value={business} onChange={(e) => setBusiness(e.target.value)} />
              </Field>
              <Field label="Met on" hint="e.g. 21 Nov 2026">
                <input className="field__input" value={n.metOn} onChange={(e) => set("metOn", e.target.value)} />
              </Field>
              <Field label="Who you spoke to">
                <input className="field__input" value={n.contactName} onChange={(e) => set("contactName", e.target.value)} />
              </Field>
              <Field label="Their role">
                <input className="field__input" value={n.contactRole} onChange={(e) => set("contactRole", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="field__input" type="email" value={n.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} />
              </Field>
              <Field label="Phone">
                <input className="field__input" value={n.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} />
              </Field>
            </div>
          </div>
        </section>

        {DISCOVERY_QUESTIONS.map((q, i) => (
          <section key={q.key} className="card">
            <div className="card__body">
              <div className="section__head">
                <h2 className="section__title">
                  {i + 1}. {q.question}
                </h2>
                <p className="section__sub">{q.hint}</p>
              </div>
              <textarea
                className="field__input field__area"
                rows={q.key === "q2" ? 5 : 3}
                aria-label={q.question}
                value={n.answers[q.key]}
                onChange={(e) => set("answers", { ...n.answers, [q.key]: e.target.value })}
              />
              {q.key === "q3" ? (
                <Field label="The value number" hint="The figure, in a line. It becomes the proposal’s objective.">
                  <input className="field__input" placeholder="e.g. ~20 missed orders a week, about ₦300,000" value={n.valueNumber} onChange={(e) => set("valueNumber", e.target.value)} />
                </Field>
              ) : null}
              {q.key === "q4" ? (
                <Field label="Decision-maker" hint="Their name. They become the signer on the proposal.">
                  <input className="field__input" value={n.decisionMaker} onChange={(e) => set("decisionMaker", e.target.value)} />
                </Field>
              ) : null}
              {q.key === "q5" ? (
                <div className="desk-two">
                  <Field label="Their answer">
                    <select className="field__input" value={n.followUp} onChange={(e) => set("followUp", e.target.value as DiscoveryNotes["followUp"])}>
                      <option value="">Not asked yet</option>
                      <option value="yes">Yes</option>
                      <option value="maybe">Maybe</option>
                      <option value="no">No</option>
                    </select>
                  </Field>
                  <Field label="Follow up on">
                    <input className="field__input" placeholder="e.g. 28 Nov" value={n.followUpOn} onChange={(e) => set("followUpOn", e.target.value)} />
                  </Field>
                </div>
              ) : null}
            </div>
          </section>
        ))}

        <section className="card">
          <div className="card__body">
            <Field label="Other notes">
              <textarea className="field__input field__area" rows={4} value={n.notes} onChange={(e) => set("notes", e.target.value)} />
            </Field>
          </div>
        </section>
      </div>

      <aside className="desk-side">
        <div className="desk-sticky">
          <section className="card">
            <div className="card__body">
              <div className="actions">
                <button type="button" className="button" disabled={!dirty || pending} onClick={save}>
                  {pending ? "Saving…" : dirty ? "Save" : "Saved"}
                </button>
                {msg ? <span className="muted" role="status">{msg}</span> : null}
              </div>
              <p className="m-0 field__hint">Questions 3 and 4 decide whether a proposal is worth writing.</p>
            </div>
          </section>
          <section className="card">
            <div className="card__body">
              <div className="section__head">
                <h2 className="section__title">Proposal</h2>
                <p className="section__sub">
                  {proposalUrl ? "A proposal was started from these notes." : "Pre-fills the client, “In your words” (answer 2), the objective (the value number) and the signer (the decision-maker)."}
                </p>
              </div>
              {proposalUrl ? (
                <a href={proposalUrl} className="button button--pale">
                  Open proposal
                </a>
              ) : (
                <form action={proposalFromDiscoveryAction.bind(null, id)}>
                  <button type="submit" className="button" disabled={dirty}>
                    Start a proposal
                  </button>
                  {dirty ? <p className="m-0 field__hint">Save first.</p> : null}
                </form>
              )}
              <form
                action={deleteDiscoveryAction.bind(null, id)}
                onSubmit={(e) => {
                  if (!confirm("Delete these notes?")) e.preventDefault();
                }}
              >
                <button type="submit" className="text-link desk-plain">
                  Delete notes
                </button>
              </form>
            </div>
          </section>
        </div>
      </aside>
    </div>
  );
}
