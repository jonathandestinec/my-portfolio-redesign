import type { Metadata } from "next";

// Proposals admin. proxy.ts answers 404 here unless the private entry address was
// visited first, and every page and action also checks the owner's GitHub account.
export const metadata: Metadata = {
  title: { absolute: "Proposals · Studio" },
  robots: { index: false, follow: false, nocache: true },
};

export default function DeskLayout({ children }: LayoutProps<"/desk">) {
  return <div className="desk">{children}</div>;
}
