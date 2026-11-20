import { randomInt } from "node:crypto";

const ALPHABET = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
/** 22 base62 characters ≈ 131 bits from the OS's secure random source. */
export const TOKEN_LENGTH = 22;

export function newToken(length = TOKEN_LENGTH): string {
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[randomInt(ALPHABET.length)];
  return out;
}

/** "Acme Foods Ltd." → "acme-foods-ltd". Only for readability in the link. */
export function slugify(name: string): string {
  const s = name
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40)
    .replace(/-+$/g, "");
  return s || "client";
}

/** The path segment the client gets: /p/<slug>-<token>. */
export const proposalKey = (slug: string, token: string) => `${slug}-${token}`;

/** Pulls the token back out of a key. The slug part is ignored, so renaming a client never breaks a link. */
export function tokenFromKey(key: string): string | null {
  const token = key.slice(key.lastIndexOf("-") + 1);
  return token.length === TOKEN_LENGTH && /^[0-9A-Za-z]+$/.test(token) ? token : null;
}
