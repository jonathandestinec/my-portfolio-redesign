import type { Metadata } from "next";
import KeystaticApp from "./keystatic";

// The admin panel. proxy.ts answers 404 here unless the private entry address
// was visited first; these pages are never linked, listed or indexed.
export const metadata: Metadata = {
  title: "Studio",
  robots: { index: false, follow: false, nocache: true },
};

export default function Layout() {
  return <KeystaticApp />;
}
