import { createHash } from "node:crypto";
import type { Snapshot } from "./types";

/** JSON with object keys sorted at every level, so the same content always gives the same bytes. */
export function canonicalJson(value: unknown): string {
  return JSON.stringify(value, (_key, v) => {
    if (v && typeof v === "object" && !Array.isArray(v)) {
      return Object.fromEntries(Object.keys(v).sort().map((k) => [k, (v as Record<string, unknown>)[k]]));
    }
    return v;
  });
}

export const sha256 = (s: string | Uint8Array) => createHash("sha256").update(s).digest("hex");

/**
 * Fingerprint of what the client agrees to: the whole snapshot (contract text,
 * price table, scope, parties and version). Recorded with every signature.
 */
export const snapshotHash = (snapshot: Snapshot) => sha256(canonicalJson(snapshot));
