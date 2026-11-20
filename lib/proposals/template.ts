/** Contract templates use {{placeholder}} markers, e.g. {{client}}, {{total}}. */

const MARKER = /\{\{\s*([a-zA-Z][a-zA-Z0-9_]*)\s*\}\}/g;

export function placeholders(body: string): string[] {
  return [...new Set([...body.matchAll(MARKER)].map((m) => m[1]))];
}

/**
 * Replaces known placeholders. Unknown ones are left as they are, so a typo stays
 * visible in the preview instead of silently disappearing.
 */
export function fillTemplate(body: string, values: Record<string, string>): string {
  return body.replace(MARKER, (whole, key: string) => (key in values ? values[key] : whole));
}

/** Placeholders still present after filling: shown as a warning before sending. */
export const unfilled = (body: string) => placeholders(body);
