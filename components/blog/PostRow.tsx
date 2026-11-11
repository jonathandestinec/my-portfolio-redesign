import { RowList } from "@/components/blocks/RowList";
import { formatDate, type Post } from "@/lib/posts";

export function PostRows({ posts }: { posts: Post[] }) {
  return (
    <RowList
      rows={posts.map((p) => ({
        label: formatDate(p.date),
        title: p.title,
        body: p.summary,
        aside: (
          <span className="text-[13px] text-ink-faint">
            {p.readingMinutes} min
          </span>
        ),
        href: `/blog/${p.slug}`,
      }))}
    />
  );
}
