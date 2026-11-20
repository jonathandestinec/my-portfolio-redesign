"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import { SignaturePad, type SignatureMethod, type SignaturePadHandle } from "./SignaturePad";

/** The client's half of the agreement. Posts to /api/p/<key>/sign with the version and fingerprint they read. */
export function SignForm({
  endpoint,
  version,
  contentSha256,
  defaultName,
  defaultEmail,
}: {
  endpoint: string;
  version: number;
  contentSha256: string;
  defaultName: string;
  defaultEmail: string;
}) {
  const router = useRouter();
  const pad = useRef<SignaturePadHandle>(null);
  const [name, setName] = useState(defaultName);
  const [email, setEmail] = useState(defaultEmail);
  const [title, setTitle] = useState("");
  const [agree, setAgree] = useState(false);
  const [sig, setSig] = useState<{ method: SignatureMethod; ready: boolean }>({ method: "typed", ready: false });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const onPad = useCallback((s: { method: SignatureMethod; ready: boolean }) => setSig(s), []);

  const ready = name.trim().length > 1 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim()) && agree && sig.ready;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!ready || busy) return;
    setBusy(true);
    setError(null);
    try {
      const image = await pad.current?.toDataUrl();
      if (!image) throw new Error("Add your signature first.");
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version, contentSha256, name, email, title, method: sig.method, image, agree }),
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setBusy(false);
    }
  }

  return (
    <form className="pp-form card" onSubmit={submit} noValidate>
      <div className="card__body">
        <div className="pp-fields">
          <label className="field">
            <span className="field__label">Full name</span>
            <input className="field__input" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" required />
          </label>
          <label className="field">
            <span className="field__label">Email</span>
            <input
              className="field__input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </label>
          <label className="field">
            <span className="field__label">
              Role or title <span className="faint">(optional)</span>
            </span>
            <input className="field__input" value={title} onChange={(e) => setTitle(e.target.value)} autoComplete="organization-title" />
          </label>
        </div>

        <div className="field">
          <span className="field__label">Signature</span>
          <SignaturePad ref={pad} name={name} onChange={onPad} />
        </div>

        <label className="pp-agree">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          <span>I have read and agree to the terms above.</span>
        </label>

        {error ? (
          <p className="pp-error" role="alert">
            {error}
          </p>
        ) : null}

        <div className="actions">
          <button type="submit" className="button" disabled={!ready || busy} aria-disabled={!ready || busy}>
            {busy ? "Signing…" : "Sign the agreement"}
          </button>
          <span className="cta__note">Your name, the time, your IP address and browser are recorded with your signature.</span>
        </div>
      </div>
    </form>
  );
}
