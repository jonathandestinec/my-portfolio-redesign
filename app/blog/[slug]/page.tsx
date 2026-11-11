import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import { MetaTable } from "@/components/blocks/MetaTable";
import { Prose } from "@/components/blog/Prose";
import { PageHero } from "@/components/hero/PageHero";
import { SiteShell } from "@/components/layout/SiteShell";
import { formatDate, getAllPosts, listSlugs } from "@/lib/posts";

// First request for an unlisted slug must wait for the full render so notFound() yields a real 404.
export const ensureStatic = "navigation";

// `dynamicParams` is not allowed with cacheComponents; unknown slugs 404 via notFound() in load().
export function generateStaticParams() {
  return listSlugs().map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

const load = cache(async (slug: string) => {
  if (!listSlugs().includes(slug)) notFound();
  const posts = await getAllPosts();
  const post = posts.find((p) => p.slug === slug);
  if (!post) notFound();
  return post;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = await load(slug);
  return { title: post.title, description: post.summary };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = await load(slug);
  const { default: Body } = await import(`@/content/blog/${slug}.mdx`);
  return (
    <SiteShell
      variant="detail"
      back={{ href: "/blog", label: "← All writing" }}
    >
      <PageHero
        variant="minor"
        title={post.title}
        body={post.summary}
        meta={
          <MetaTable
            rows={[
              ["Date", formatDate(post.date, true)],
              ["Reading time", `${post.readingMinutes} min read`],
              ["Tags", post.tags.join(", ") || "—"],
            ]}
          />
        }
      />
      <Prose>
        <Body />
      </Prose>
    </SiteShell>
  );
}
