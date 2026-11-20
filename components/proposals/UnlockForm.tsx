"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function UnlockForm({ endpoint }: { endpoint: string }) {
  const router = useRouter();
  const [passcode, setPasscode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  return (
    <form
      className="pp-unlock"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        const res = await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ passcode }),
        });
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        if (res.ok) return router.refresh();
        setError(data.error ?? "Something went wrong.");
        setBusy(false);
      }}
    >
      <label className="field">
        <span className="field__label">Passcode</span>
        <input
          className="field__input"
          value={passcode}
          onChange={(e) => setPasscode(e.target.value)}
          autoComplete="one-time-code"
          autoFocus
          required
        />
      </label>
      {error ? (
        <p className="pp-error" role="alert">
          {error}
        </p>
      ) : null}
      <div className="actions">
        <button type="submit" className="button" disabled={busy || !passcode.trim()}>
          {busy ? "Checking…" : "Open proposal"}
        </button>
      </div>
    </form>
  );
}
