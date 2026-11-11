import Link from "next/link";
import { site } from "@/content/site";

export function Wordmark({ size = "md" }: { size?: "sm" | "md" }) {
  const text = size === "sm" ? "text-[22px]" : "text-[34px]";
  return (
    <Link
      href="/"
      aria-label={`${site.firstName} ${site.lastName}, home`}
      className={`inline-block font-display font-medium leading-[0.85] tracking-tight text-ink ${text}`}
    >
      <span className="block">{site.firstName}</span>
      <span className="block">
        {site.lastName}
        <sup className="ml-0.5 align-top text-[0.3em] font-normal leading-none">®</sup>
      </span>
    </Link>
  );
}
