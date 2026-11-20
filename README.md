# Destine Jonathan, portfolio

Personal portfolio for Destine Jonathan, a FullStack Developer & Automation Engineer. It has a home page (works strip, experience, education, stack, GitHub activity, writing), a page for every menu entry (Works, Experience, Education, Stack, Writing, Contact), an AgroHub case study, a small MDX blog with RSS, a generated résumé PDF, and Open Graph images. Built with Next.js 16 (App Router, `cacheComponents`), React 19, Tailwind CSS and Motion. It works without JavaScript and honours reduced motion.

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
| `bun run capture <project>` | Screenshot a live project (`agrohub` or `huddle`) into `captures/<project>/`, to upload through the admin panel |

## Environment variables

Copy `.env.example` to `.env.local`.

- `GITHUB_TOKEN` (optional): a read-only token with no scopes, used for the GraphQL contribution calendar. Without it (or if that call fails) the site reads the public calendar at `github.com/users/<login>/contributions`. Only if both fail does the grid show data labelled "sample data" (cached for minutes only, so it recovers quickly).
- `NEXT_PUBLIC_SITE_URL`: the public origin, no trailing slash. Drives the résumé PDF links, canonical URLs, sitemap, robots, RSS and OG URLs. Defaults to `https://destinejc.vercel.app` when empty.

## Editing content: the admin panel

Content is edited in a private admin panel ([Keystatic](https://keystatic.com)), not in code.

- **Opening it:** go to your private entry address (`ADMIN_ENTRY_PATH`, set only in Vercel). It sets a 30-day cookie and opens the panel. Sign in with GitHub.
- **Saving:** each save is a commit to `master` on GitHub. Vercel redeploys and the change is live in about a minute. Every edit is in the git history, so any change can be undone.
- **What it edits:**

  | Section | File |
  | --- | --- |
  | Site & hero | `content/site.json` |
  | Projects (one per case study, ordered by *Order*; the first two are named in the hero) | `content/projects/<slug>.json` |
  | Client work & experiments | `content/playground.json` |
  | Experience | `content/experience.json` |
  | Education | `content/education.json` |
  | Stack | `content/stack.json` |
  | Writing (posts, with a rich editor) | `content/blog/<slug>.mdx` |

  Uploaded images are stored under `public/work/`, `public/logos/` and `public/blog/`. The résumé, sitemap and RSS update from the same files.
- **Hidden from visitors:** Keystatic always lives at `/keystatic` and `/api/keystatic`. `proxy.ts` (logic in `lib/admin-gate.ts`) answers those with the site's normal 404 unless the entry address was visited first. The panel is not linked anywhere, is not in the sitemap or robots.txt, and sends `noindex`. Saving also needs a GitHub account with write access to this repo.
- **Locally:** `bun run dev`, then open `http://localhost:3000/keystatic`. In development the panel edits the files on disk, and there is no gate.

### One-time setup (Vercel environment variables)

| Variable | What it is |
| --- | --- |
| `ADMIN_ENTRY_PATH` | The private entry address, e.g. `/studio-…` (letters, digits, `-` or `_`, at least 8 characters after the slash) |
| `ADMIN_GATE_TOKEN` | A long random string (32+ characters) that becomes the gate cookie |
| `KEYSTATIC_SECRET` | A long random string Keystatic uses to sign its session |
| `KEYSTATIC_GITHUB_CLIENT_ID` | From the GitHub App (below) |
| `KEYSTATIC_GITHUB_CLIENT_SECRET` | From the GitHub App (below) |
| `NEXT_PUBLIC_KEYSTATIC_GITHUB_APP_SLUG` | The GitHub App's URL name |

GitHub App (GitHub → Settings → Developer settings → GitHub Apps → New GitHub App):

- **Homepage URL:** `https://destinejc.vercel.app`
- **Callback URL:** `https://destinejc.vercel.app/api/keystatic/github/oauth/callback`
- **Expire user authorization tokens:** on. **Webhook:** off.
- **Repository permissions:** Contents *Read and write*, Metadata *Read-only*.
- **Where can it be installed:** only on this account. After creating it, generate a client secret and install the app on this repository only.

Without these variables the site builds and runs normally, and the admin addresses simply answer 404.

## Before deploying

- [x] Site URL: defaults to `https://destinejc.vercel.app` (`lib/site-url.ts`); set `NEXT_PUBLIC_SITE_URL` only if you move to a custom domain.
- [ ] Review the two blog posts (Writing in the admin panel), or tick *Draft* on them.
- [ ] Confirm the drafted experience, education, stack notes and case-study text in the admin panel.
- [ ] Clean the test lot on the live AgroHub `/lots` page, run `bun run capture agrohub`, and upload the new screenshots in the admin panel.
- [ ] Set `GITHUB_TOKEN` so the activity grid shows real data.

## Credits

- Hero sticker from [stick-it-up](https://github.com/Sam721166/stick-it-up) © 2026 Samiran De, used under the Stick It Up Fair-Use & Community License (see `node_modules/stick-it-up/LICENSE`).
