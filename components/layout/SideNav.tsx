"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "motion/react";
import { useActiveSection } from "@/lib/use-active-section";
import { ThemeToggle } from "./ThemeToggle";
import { Wordmark } from "./Wordmark";
import { isExternal, socialLinks, type NavLink } from "./nav-links";
import { useNavHidden } from "./nav-visibility";

type Props = { variant: "home" | "index" | "detail"; links?: NavLink[]; back?: NavLink };

export function SideNav({ variant, links = [], back }: Props) {
  const hidden = useNavHidden();
  const reduce = useReducedMotion();
  const ids = links.filter((l) => l.href.startsWith("#")).map((l) => l.href.slice(1));
  const active = useActiveSection(ids);
  const linkClass = "text-[15px] leading-5 transition-colors hover:text-ink";

  return (
    <motion.nav
      aria-label="Primary"
      inert={hidden}
      initial={false}
      animate={
        hidden
          ? { opacity: 0, filter: reduce ? "blur(0px)" : "blur(4px)" }
          : { opacity: 1, filter: "blur(0px)" }
      }
      transition={{ duration: reduce ? 0 : 0.25 }}
      className="fixed top-0 hidden h-svh w-[240px] flex-col justify-center py-16 pl-[120px] md:sticky md:flex"
    >
      <div className="mb-8">
        {variant === "detail" && back ? (
          <Link href={back.href} className={`${linkClass} text-ink-muted`}>
            ← {back.label}
          </Link>
        ) : (
          <Wordmark size="md" />
        )}
      </div>
      {links.length > 0 && (
        <ul className="flex flex-col gap-2.5">
          {links.map((l) => {
            const isActive = l.href === `#${active}`;
            return (
              <li key={l.href}>
                <Link
                  href={l.href}
                  aria-current={isActive ? "true" : undefined}
                  className={`${linkClass} ${isActive ? "text-ink" : "text-ink-muted"}`}
                >
                  {l.label}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
      <ul className={`flex flex-col gap-2.5 ${links.length > 0 ? "mt-8" : ""}`}>
        {socialLinks.map((l) => (
          <li key={l.label}>
            <a
              href={l.href}
              download={l.download ? "" : undefined}
              {...(isExternal(l.href) ? { target: "_blank", rel: "noreferrer" } : {})}
              className={`${linkClass} text-ink-muted`}
            >
              {l.label}
            </a>
          </li>
        ))}
      </ul>
      <div className="mt-8">
        <ThemeToggle />
      </div>
    </motion.nav>
  );
}
