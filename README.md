# Destine Jonathan, portfolio

Personal portfolio for Destine Jonathan, a FullStack Developer & Automation Engineer. It has a home page (works carousel, experience, stack, GitHub activity, writing, contact), an AgroHub case study, a playground of pet projects, a small MDX blog with RSS, a generated résumé PDF, and Open Graph images. Built with Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind CSS and Motion. It works without JavaScript and honours reduced motion.

## Scripts

Uses [Bun](https://bun.sh).

| Command | What it does |
| --- | --- |
| `bun run dev` | Start the dev server |
| `bun run build` / `bun run start` | Production build and server |
| `bun run lint` | ESLint |
| `bun run typecheck` | `tsc --noEmit` |
| `bun run test` | Unit tests (Vitest) |
| `bun run test:e2e` | Playwright, desktop and phone projects (builds and serves on :3100) |
| `bun run capture` | Re-capture the AgroHub screenshots in `public/work/agrohub/` |

## Environment variables

Copy `.env.example` to `.env.local`.

- `GITHUB_TOKEN` (optional): a read-only token with no scopes, used to read the public contribution calendar. If it is missing or GitHub fails, the grid shows sample data labelled "sample data" (cached for minutes only, so it recovers quickly).
- `NEXT_PUBLIC_SITE_URL`: the public origin, for example `https://example.com`. Drives canonical URLs, sitemap, robots, RSS and OG URLs. Defaults to a placeholder domain when empty.

## Editing content

- `content/site.ts`: name, role, hero text, email, social links.
- `content/projects.ts`: case studies and carousel slides. The optional `timeline` field renders a "How it's shipping" block; it is unset until confirmed.
- `content/experience.ts`, `content/stack.ts`, `content/playground.ts`: the other home and playground sections.
- `content/blog/*.mdx`: posts. Each starts with `export const meta = { title, date, summary, tags, draft }`. Set `draft: true` to keep a post out of the blog, sitemap, RSS and static params in production.
- The résumé at `/resume.pdf` is generated from the same content.

`bun run capture` re-takes the AgroHub screenshots from the live app. Run it after changing what the live app shows.

## Before deploying

- [ ] Set the real domain: `NEXT_PUBLIC_SITE_URL` (and replace the placeholder in `lib/site-url.ts`).
- [ ] Review the two blog posts in `content/blog/` (marked `TODO(content)`), or set `draft: true` on them.
- [ ] Confirm or restore the AgroHub timeline in `content/projects.ts` (removed because the phases were unconfirmed).
- [ ] Clean the test lot on the live AgroHub `/lots` page, then re-run `bun run capture`.
- [ ] Set `GITHUB_TOKEN` so the activity grid shows real data.
