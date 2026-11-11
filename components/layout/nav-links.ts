import { site } from "@/content/site";

export type NavLink = { href: string; label: string };

/** Every menu entry is its own page. */
export const pageLinks: NavLink[] = [
  { href: "/works", label: "Works" },
  { href: "/experience", label: "Experience" },
  { href: "/education", label: "Education" },
  { href: "/stack", label: "Stack" },
  { href: "/blog", label: "Writing" },
  { href: "/contact", label: "Contact" },
];

export const resumeLink = { href: "/resume.pdf", label: "Résumé ↓" };

export const socialLinks: NavLink[] = [
  { href: site.socials.github, label: "GitHub" },
  { href: site.socials.linkedin, label: "LinkedIn" },
  { href: site.socials.x, label: "X (formerly Twitter)" },
];

export const isExternal = (href: string) => /^https?:\/\//.test(href);

export const externalProps = (href: string) =>
  isExternal(href) ? { target: "_blank", rel: "noreferrer" } : {};
