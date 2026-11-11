import { ArrowLink } from "@/components/cta/ArrowLink";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";

export default function NotFound() {
  return (
    <SiteShell variant="detail" back={{ href: "/", label: "← Destine Jonathan" }}>
      <PageHero
        variant="minor"
        title="Nothing here."
        body="That page doesn't exist, or it moved."
      />
      <div className="flex flex-wrap gap-x-6 gap-y-2 py-4">
        <ArrowLink href="/">Back home</ArrowLink>
        <ArrowLink href="/blog">Read the writing</ArrowLink>
      </div>
    </SiteShell>
  );
}
