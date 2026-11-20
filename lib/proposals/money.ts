import type { Currency, Milestone } from "./types";

const SYMBOL: Record<Currency, string> = { NGN: "₦", USD: "$" };

/** 150000 (kobo) → "₦1,500.00". Integer maths only; the decimal point is placed, not computed. */
export function formatMoney(minor: number, currency: Currency): string {
  if (!Number.isSafeInteger(minor)) throw new Error("Amount must be an integer number of minor units");
  const sign = minor < 0 ? "-" : "";
  const abs = Math.abs(minor);
  const major = Math.floor(abs / 100).toLocaleString("en-US");
  const cents = String(abs % 100).padStart(2, "0");
  return `${sign}${SYMBOL[currency]}${major}.${cents}`;
}

/**
 * Parses what the owner types ("1,500", "₦1,500.50", "$20") into minor units.
 * Returns null for anything that isn't a non-negative amount with at most two decimals.
 */
export function parseAmount(input: string): number | null {
  const s = input.trim().replace(/^[₦$]/, "").replace(/,/g, "").trim();
  const m = /^(\d{1,13})(?:\.(\d{1,2}))?$/.exec(s);
  if (!m) return null;
  const cents = m[2] ? Number(m[2].padEnd(2, "0")) : 0;
  return Number(m[1]) * 100 + cents;
}

/** Minor units back to an editable string: 150050 → "1500.50", 150000 → "1500". */
export function amountInput(minor: number): string {
  const cents = minor % 100;
  return cents ? `${Math.floor(minor / 100)}.${String(cents).padStart(2, "0")}` : String(minor / 100);
}

export function totalMinor(milestones: Pick<Milestone, "amountMinor">[]): number {
  return milestones.reduce((sum, m) => {
    if (!Number.isSafeInteger(m.amountMinor) || m.amountMinor < 0) throw new Error("Invalid milestone amount");
    return sum + m.amountMinor;
  }, 0);
}
