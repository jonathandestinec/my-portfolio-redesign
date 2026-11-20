import type { Status, StoredStatus } from "./types";

type Row = { status: StoredStatus; expiresAt: Date | null };

/** A sent or viewed proposal past its expiry date is expired. Signed and withdrawn are final. */
export function effectiveStatus(row: Row, now = new Date()): Status {
  if ((row.status === "sent" || row.status === "viewed") && row.expiresAt && row.expiresAt <= now) return "expired";
  return row.status;
}

/** Whether a client opening the link sees the proposal at all. */
export const isVisibleToClient = (s: Status) => s === "sent" || s === "viewed" || s === "signed";

/** The owner may change content until it is signed or withdrawn. */
export const isEditable = (s: Status) => s === "draft" || s === "sent" || s === "viewed" || s === "expired";

export const DEFAULT_VALIDITY_DAYS = 14;

export function expiryFrom(from: Date, days: number): Date {
  return new Date(from.getTime() + days * 24 * 60 * 60 * 1000);
}

export const STATUS_LABEL: Record<Status, string> = {
  draft: "Draft",
  sent: "Sent",
  viewed: "Viewed",
  signed: "Signed",
  withdrawn: "Withdrawn",
  expired: "Expired",
};
