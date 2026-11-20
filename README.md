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

## Client proposals

A private page per client at `/p/<client>-<random>`: both logos, the brief, relevant work picked from the portfolio's own projects, scope, milestones and price, and a contract the client signs on the page (typed or drawn signature). Both sides get a signed PDF with an audit page. The full design is in `docs/superpowers/specs/2026-11-20-client-proposals-design.md`.

**Where things live.** The repo is public, so client data is not in it:

- Proposals, versions, views and signatures: Neon Postgres (project `portfolio-proposals`; schema in `db/migrations/`).
- Logos, signature images and signed PDFs: a **private** Vercel Blob store, served only through proposal routes.
- Reusable, non-private pieces are edited in Studio under **Proposals**: contract templates (`content/contracts/`), your defaults (`content/proposal-defaults.json`), and **work tags** on projects and client sites, which drive the "relevant work" suggestions.

**Using it.**

1. Open the private admin address, sign in to Studio with GitHub, then go to `/desk`. The proposals admin sits behind the same hidden gate and also checks your GitHub account id (`ADMIN_GITHUB_ID`) on every page and action.
2. **New proposal** starts from your default intro and contract. Fill in the client, brief and tags, pick relevant work, add scope and milestones (amounts like `150,000` or `1500.50`), and adjust the contract. Placeholders like `{{client}}` and `{{total}}` are filled in when you send.
3. **Preview** shows exactly what the client will see; **PDF** gives the same as a file.
4. **Sign and send** puts your signature on it and makes the link live, valid for 14 days by default. Copy the link and send it yourself. Optional: add a passcode and send that separately.
5. Editing after sending is fine: save, then **Send update**. The client sees the new version and can only sign the latest one.
6. When the client signs, the proposal is frozen, the signed PDF is stored, and you get an email with it attached. The client downloads theirs from the page.

**How a signature is recorded.** Name, email, optional title, the signature image, time (UTC), IP address and browser, and a SHA-256 fingerprint of everything the client saw in that version (contract text, prices, scope, parties). Signing is a single database statement that only succeeds for the current version, before expiry, with a matching fingerprint. Proposal pages and files send `noindex` and `no-store` and never appear in the sitemap.

**Before relying on the contract:** `content/contracts/standard.json` is a starting template. Have a lawyer review it once.

**Emails** go only to you for now, from Resend's shared sender. To email clients too, verify a domain in Resend and set `PROPOSALS_FROM_EMAIL`.

**Local development.** Put a Neon *dev branch* URL in `.env.local` as `DATABASE_URL` (never production: the tests write to it). Without `ADMIN_GITHUB_ID`, `next dev` lets you into `/desk` without signing in. Files go to `.data/` when there is no Blob token. In a sandbox behind a proxy, run Node with `NODE_USE_ENV_PROXY=1`.

To apply a migration: `DATABASE_URL=... bun scripts/migrate.ts db/migrations/0001_proposals.sql`.

| Variable | Where | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Vercel (production: main branch; preview: dev branch) | Neon connection string |
| `ADMIN_GITHUB_ID` | Vercel | The only GitHub account allowed into `/desk` |
| `PROPOSALS_SECRET` | Vercel | Signs passcode cookies, hashes viewer IPs |
| `BLOB_READ_WRITE_TOKEN` | Vercel (added by connecting the Blob store) | Private file storage |
| `RESEND_API_KEY`, `PROPOSALS_NOTIFY_EMAIL` | Vercel | Opened and signed emails to you |

## Before deploying

- [x] Site URL: defaults to `https://destinejc.vercel.app` (`lib/site-url.ts`); set `NEXT_PUBLIC_SITE_URL` only if you move to a custom domain.
- [ ] Review the two blog posts (Writing in the admin panel), or tick *Draft* on them.
- [ ] Confirm the drafted experience, education, stack notes and case-study text in the admin panel.
- [ ] Clean the test lot on the live AgroHub `/lots` page, run `bun run capture agrohub`, and upload the new screenshots in the admin panel.
- [ ] Set `GITHUB_TOKEN` so the activity grid shows real data.

## Credits

- Hero sticker from [stick-it-up](https://github.com/Sam721166/stick-it-up) © 2026 Samiran De, used under the Stick It Up Fair-Use & Community License (see `node_modules/stick-it-up/LICENSE`).
