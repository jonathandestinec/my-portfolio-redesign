import "server-only";
import { Resend } from "resend";

/**
 * Notifications go to the owner only (PROPOSALS_NOTIFY_EMAIL). Until a domain is
 * verified in Resend, mail is sent from Resend's shared onboarding address,
 * which can only deliver to the Resend account's own email.
 */
export async function notifyOwner(input: { subject: string; text: string; attachment?: { filename: string; content: Buffer } }) {
  const key = process.env.RESEND_API_KEY;
  const to = process.env.PROPOSALS_NOTIFY_EMAIL;
  if (!key || !to) return { sent: false as const, reason: "not configured" };
  const resend = new Resend(key);
  const { error } = await resend.emails.send({
    from: process.env.PROPOSALS_FROM_EMAIL || "Proposals <onboarding@resend.dev>",
    to,
    subject: input.subject,
    text: input.text,
    attachments: input.attachment ? [{ filename: input.attachment.filename, content: input.attachment.content }] : undefined,
  });
  if (error) {
    console.error("proposal email failed", error);
    return { sent: false as const, reason: error.message };
  }
  return { sent: true as const };
}
