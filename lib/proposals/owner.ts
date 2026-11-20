import "server-only";
import { cookies } from "next/headers";
import { sha256 } from "./hash";

/**
 * The proposals admin trusts one GitHub account: ADMIN_GITHUB_ID. It reuses the
 * sign-in from Studio (Keystatic), which leaves a short-lived GitHub access
 * token in the `keystatic-gh-access-token` cookie, and asks GitHub whose it is.
 * The hidden gate in proxy.ts runs first, so strangers never get this far.
 */

const TOKEN_COOKIE = "keystatic-gh-access-token";
const CACHE_MS = 5 * 60 * 1000;
const seen = new Map<string, { id: number; login: string; until: number }>();

export type Owner = { id: number; login: string };

/** Only for local development and the end-to-end tests: never set on Vercel. */
function testOwner(): Owner | null {
  if (process.env.VERCEL) return null;
  if (process.env.NODE_ENV === "development" && !process.env.ADMIN_GITHUB_ID) return { id: 0, login: "dev" };
  if (process.env.PROPOSALS_TEST_OWNER === "1") return { id: 0, login: "test" };
  return null;
}

async function lookup(token: string): Promise<Owner | null> {
  const key = sha256(token);
  const hit = seen.get(key);
  if (hit && hit.until > Date.now()) return { id: hit.id, login: hit.login };
  const res = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json", "User-Agent": "portfolio-proposals" },
    cache: "no-store",
  });
  if (!res.ok) return null;
  const user = (await res.json()) as { id: number; login: string };
  seen.set(key, { id: user.id, login: user.login, until: Date.now() + CACHE_MS });
  return { id: user.id, login: user.login };
}

/** The signed-in owner, or null. Never throws for a stranger. */
export async function currentOwner(): Promise<Owner | null> {
  const test = testOwner();
  if (test) return test;
  const allowed = Number(process.env.ADMIN_GITHUB_ID);
  if (!allowed) return null;
  const token = (await cookies()).get(TOKEN_COOKIE)?.value;
  if (!token) return null;
  const user = await lookup(token).catch(() => null);
  return user && user.id === allowed ? user : null;
}

export class NotOwnerError extends Error {
  constructor() {
    super("Not allowed");
  }
}

/** For server actions and admin routes: every action is checked on the server. */
export async function requireOwner(): Promise<Owner> {
  const owner = await currentOwner();
  if (!owner) throw new NotOwnerError();
  return owner;
}
