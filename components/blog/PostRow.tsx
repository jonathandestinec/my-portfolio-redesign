import Link from "next/link";
import { formatDate, type Post } from "@/lib/posts";

/** Writing as a bordered list: title + summary, date and reading time. */
export function PostRows({ posts, summaries = true }: { posts: Post[]; summaries?: boolean }) {
  return (
    <ul className="list">
      {posts.map((p) => (
        <li key={p.slug}>
          <Link href={`/blog/${p.slug}`} className="list__row list__row-link">
            <span className="flex min-w-0 flex-col gap-1">
              <span className="medium">{p.title}</span>
              {summaries ? <span className="muted">{p.summary}</span> : null}
            </span>
            <span className="faint whitespace-nowrap text-[14px]">
              {formatDate(p.date, true)} · {p.readingMinutes} min
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
