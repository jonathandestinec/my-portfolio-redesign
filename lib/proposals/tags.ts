/** The fixed list of work tags, used on projects (admin panel) and proposals. */
export const WORK_TAGS = [
  { label: "Payments", value: "payments" },
  { label: "Marketplace", value: "marketplace" },
  { label: "E-commerce", value: "ecommerce" },
  { label: "Events", value: "events" },
  { label: "Community", value: "community" },
  { label: "Automation", value: "automation" },
  { label: "Dashboard", value: "dashboard" },
  { label: "Mobile-first", value: "mobile-first" },
  { label: "Auth", value: "auth" },
  { label: "Realtime", value: "realtime" },
  { label: "Content site", value: "content-site" },
  { label: "Landing page", value: "landing-page" },
  { label: "Media & streaming", value: "media" },
  { label: "AI", value: "ai" },
] as const;

export type WorkTag = (typeof WORK_TAGS)[number]["value"];
export const WORK_TAG_VALUES: string[] = WORK_TAGS.map((t) => t.value);
export const tagLabel = (v: string) => WORK_TAGS.find((t) => t.value === v)?.label ?? v;
