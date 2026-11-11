import type { Metadata } from "next";
import { Caveat, Funnel_Display, Funnel_Sans, Geist_Mono } from "next/font/google";
import { ThemeScript } from "@/components/layout/ThemeScript";
import "./globals.css";

const display = Funnel_Display({
  weight: ["500", "600"],
  variable: "--font-display-src",
  subsets: ["latin"],
});
const sans = Funnel_Sans({ variable: "--font-sans-src", subsets: ["latin"] });
const hand = Caveat({ variable: "--font-hand-src", subsets: ["latin"] });
const mono = Geist_Mono({ variable: "--font-mono-src", subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Destine Jonathan — FullStack Developer & Automation Engineer",
    template: "%s — Destine Jonathan",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${display.variable} ${sans.variable} ${hand.variable} ${mono.variable} antialiased`}
    >
      <head>
        <ThemeScript />
      </head>
      <body>
        <a
          href="#content"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-pill focus:px-4 focus:py-2 focus:text-pill-ink"
        >
          Skip to content
        </a>
        {children}
      </body>
    </html>
  );
}
