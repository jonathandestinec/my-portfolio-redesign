import Link from "next/link";
import { site } from "@/content/site";

export function Wordmark({
  side,
  current,
}: {
  /** Sidebar version: dimmed until hovered or on the home page. */
  side?: boolean;
  current?: boolean;
}) {
  return (
    <Link
      href="/"
      aria-label={`${site.firstName} ${site.lastName}, home`}
      aria-current={current ? "page" : undefined}
      className={`wordmark${side ? " wordmark--side" : ""}`}
    >
      <span className="block">{site.firstName}</span>
      <span className="block">
        {site.lastName}
        <sup>®</sup>
      </span>
    </Link>
  );
}
