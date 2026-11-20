import "server-only";
import { createHmac, randomBytes, scrypt as scryptCb, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scrypt = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;

function secret(): string {
  const s = process.env.PROPOSALS_SECRET;
  if (s && s.length >= 32) return s;
  if (process.env.VERCEL) throw new Error("PROPOSALS_SECRET is not set");
  return "local-development-only-secret-not-for-production";
}

/** Passcodes are stored as scrypt hashes: "salt:hash", both hex. */
export async function hashPasscode(passcode: string): Promise<string> {
  const salt = randomBytes(16);
  const hash = await scrypt(passcode, salt, 32);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export async function checkPasscode(passcode: string, stored: string): Promise<boolean> {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const hash = await scrypt(passcode, Buffer.from(saltHex, "hex"), 32);
  const want = Buffer.from(hashHex, "hex");
  return want.length === hash.length && timingSafeEqual(want, hash);
}

const hmac = (s: string) => createHmac("sha256", secret()).update(s).digest("base64url");

/** Cookie that remembers a correct passcode for one proposal (bound to its stored hash, so changing the passcode logs everyone out). */
export const unlockCookieName = (proposalId: string) => `p_${proposalId.slice(0, 8)}`;
export const unlockValue = (proposalId: string, passcodeHash: string) => hmac(`unlock:${proposalId}:${passcodeHash}`);

export function sameString(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

/** Views store a keyed hash of the IP, not the IP. Signatures store the IP itself (it is evidence). */
export const ipHash = (ip: string | null) => (ip ? hmac(`ip:${ip}`).slice(0, 24) : null);

export function clientIp(h: Headers): string | null {
  const fwd = h.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim() || null;
  return h.get("x-real-ip");
}

/**
 * Small fixed-window limiter per key, kept in memory. Each server instance
 * counts on its own, which is enough to stop casual guessing and double posts.
 */
const windows = new Map<string, { count: number; until: number }>();

export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const w = windows.get(key);
  if (!w || w.until <= now) {
    windows.set(key, { count: 1, until: now + windowMs });
    if (windows.size > 5000) for (const [k, v] of windows) if (v.until <= now) windows.delete(k);
    return true;
  }
  w.count += 1;
  return w.count <= limit;
}
