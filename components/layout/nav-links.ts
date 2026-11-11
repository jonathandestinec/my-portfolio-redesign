import { site } from "@/content/site";

export type NavLink = { href: string; label: string };

export const homeLinks: NavLink[] = [
  { href: "#works", label: "Works" },
  { href: "#experience", label: "Experience" },
  { href: "#stack", label: "Stack" },
];

export const socialLinks: (NavLink & { download?: boolean })[] = [
  { href: "/resume.pdf", label: "Résumé", download: true },
  { href: site.socials.github, label: "GitHub" },
  { href: site.socials.linkedin, label: "LinkedIn" },
  { href: site.socials.x, label: "X" },
];

export const isExternal = (href: string) => /^https?:\/\//.test(href);
