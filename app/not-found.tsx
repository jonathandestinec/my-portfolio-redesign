import type { Metadata } from "next";
import Link from "next/link";
import { Intro, Lead } from "@/components/hero/Lead";
import { SiteShell } from "@/components/layout/SiteShell";

export const metadata: Metadata = { title: "Not found" };

export default function NotFound() {
  return (
    <SiteShell back={{ href: "/", label: "← Home" }} closing={null}>
      <Intro narrow>
        <Lead title="Nothing here." statements={[["That page doesn't exist, or it moved."]]}>
          <div className="cta">
            <div className="actions">
              <Link href="/" className="button">
                Back home
              </Link>
              <Link href="/works" className="text-link">
                See my work →
              </Link>
            </div>
          </div>
        </Lead>
      </Intro>
    </SiteShell>
  );
}
