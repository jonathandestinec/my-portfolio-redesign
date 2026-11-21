import { timingSafeEqual } from "node:crypto";

/**
 * Gate in front of the admin panel (Keystatic, which always lives at
 * /keystatic and /api/keystatic) and the proposals admin (/desk, /api/desk).
 * Visitors get the site's normal 404 there.
 * Visiting the private entry address (ADMIN_ENTRY_PATH, set only in Vercel)
 * stores ADMIN_GATE_TOKEN in an httpOnly cookie and opens the panel. Saving
 * still needs the owner's GitHub sign-in with write access to the repo.
 */

export const GATE_COOKIE = "__studio";
export const GATE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export type GateEnv = {
  entryPath?: string;
  token?: string;
  /** In `next dev` the panel edits local files and is open without the gate. */
  dev?: boolean;
};

export type GateDecision =
  | { kind: "pass" }
  | { kind: "enter"; token: string }
  | { kind: "admin" }
  | { kind: "not-found" };

const ADMIN_PREFIXES = ["/keystatic", "/api/keystatic", "/desk", "/api/desk"];

export function isAdminPath(pathname: string): boolean {
  return ADMIN_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

/** Client proposal and invoice pages and their files: public to whoever has the link, but never indexed or cached. */
export function isProposalPath(pathname: string): boolean {
  return ["/p/", "/api/p/", "/i/", "/api/i/"].some((p) => pathname.startsWith(p));
}

/** The gate is on only with a real entry path and a long random token. */
export function gateEnabled(env: GateEnv): env is GateEnv & { entryPath: string; token: string } {
  return (
    typeof env.entryPath === "string" &&
    /^\/[A-Za-z0-9_-]{8,}$/.test(env.entryPath) &&
    typeof env.token === "string" &&
    env.token.length >= 32
  );
}

function sameToken(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export function decide(pathname: string, cookie: string | undefined, env: GateEnv): GateDecision {
  const enabled = gateEnabled(env);
  if (enabled && pathname === env.entryPath) return { kind: "enter", token: env.token };
  if (!isAdminPath(pathname)) return { kind: "pass" };
  if (enabled) return sameToken(cookie, env.token) ? { kind: "admin" } : { kind: "not-found" };
  return env.dev ? { kind: "admin" } : { kind: "not-found" };
}
