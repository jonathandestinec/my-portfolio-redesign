"use client";

import { useState, useTransition } from "react";
import { saveBusinessAction } from "@/app/desk/actions";
import type { BusinessSettings } from "@/lib/proposals/invoice-types";

const FIELDS: { key: keyof BusinessSettings; label: string; hint?: string }[] = [
  { key: "businessName", label: "Business name", hint: "Shown at the top of every invoice." },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "address", label: "Address", hint: "Optional." },
  { key: "bankName", label: "Bank", hint: "e.g. GTBank" },
  { key: "accountName", label: "Account name" },
  { key: "accountNumber", label: "Account number" },
];

export function SettingsForm({ initial, paystack }: { initial: BusinessSettings; paystack: boolean }) {
  const [v, setV] = useState(initial);
  const [msg, setMsg] = useState<string | null>(null);
  const [pending, start] = useTransition();
  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        start(async () => {
          const r = await saveBusinessAction(v);
          setMsg(r.ok ? "Saved. New invoices use these details." : r.error);
        });
      }}
    >
      <section className="card">
        <div className="card__body">
          <div className="section__head">
            <h2 className="section__title">Business and bank details</h2>
            <p className="section__sub">Printed on invoices under “From” and “How to pay”. Stored privately in the database, not in the public repo.</p>
          </div>
          <div className="pp-fields">
            {FIELDS.map((f) => (
              <label key={f.key} className="field">
                <span className="field__label">{f.label}</span>
                <input className="field__input" value={v[f.key]} onChange={(e) => setV({ ...v, [f.key]: e.target.value })} />
                {f.hint ? <span className="field__hint">{f.hint}</span> : null}
              </label>
            ))}
          </div>
          <div className="actions">
            <button type="submit" className="button" disabled={pending}>
              {pending ? "Saving…" : "Save"}
            </button>
            {msg ? <span className="muted" role="status">{msg}</span> : null}
          </div>
        </div>
      </section>
      <section className="card">
        <div className="card__body">
          <div className="section__head">
            <h2 className="section__title">Paystack</h2>
            <p className="section__sub">
              {paystack
                ? "Connected. Invoices in naira show a “Pay by card or transfer” button."
                : "Not connected yet. Invoices show bank details only. Add PAYSTACK_SECRET_KEY in Vercel to turn on online payment."}
            </p>
          </div>
          <p className="m-0 field__hint">
            Webhook URL for the Paystack dashboard (Settings → API Keys &amp; Webhooks): <code>/api/paystack/webhook</code> on your site’s address.
          </p>
        </div>
      </section>
    </form>
  );
}
