# Portfolio Redesign — Design Spec

> **Revision 2 (2026-11-11), supersedes the sections below where they conflict.**
> The first build drifted from the reference because it was made from screenshots, not the
> live site. Revision 2 takes its values from the reference's own stylesheet:
>
> - **Type:** display lead Funnel Display 26px (≥680px: 32px) / 1.15, weight 400, −0.03em, ink at 70%;
>   first line ink 85% weight 500. Body Funnel Sans 15/22; meta 13–14px. No 600 weights anywhere.
> - **Layout:** one centred 600px column (lead 560px), 20px gutter; full-bleed work strip; bordered
>   14px-radius cards and lists; sections 80px apart; footer 112px above a hairline legal row.
> - **Nav:** desktop (≥1120px) fixed sidebar at top 92 / left 80, 160px wide, 13px weight-500 links,
>   hidden while the strip covers it. Phones/tablets: wordmark + theme + "Menu" on the page itself,
>   transparent and not sticky; the menu opens a full-screen sheet.
> - **Every menu link is its own page:** /works, /experience, /education, /stack, /blog (Writing),
>   /contact. /playground redirects to /works.
> - **CTA:** "Book a call" pill, "Email me" and "Résumé ↓" laid out side by side. No hover/tap reveal.
> - **Hand note:** "check this out :)" hangs under the AgroHub link at the end of the last hero line,
>   with the arrow pointing up at it (reference `.note`).
> - **Blur:** one-time reveal only. Elements below the fold start at opacity 0 + blur(10px) and
>   sharpen once as they enter (70ms stagger, max 350ms); nothing on screen at load is blurred and
>   nothing re-blurs. No edge blur. Reduced motion / no JS: no blur at all.
> - **Work strip:** fixed blue frame + label in the centre; slides translate underneath (inactive at 60%
>   opacity); pointer drag with momentum, click a neighbour to bring it in, arrows/Enter when focused.
> - **Experience & Education:** bordered cards with a logo, title, dates and summary; each opens in
>   place (`<details>`) to show details and highlights; the Experience/Education pages add the stack
>   and a company link, and open the card named in the URL hash.
> - **Case study:** wordmark, "Name: tagline" lead, story paragraphs, facts table, wide hero image,
>   then titled chapters with screenshots; the sidebar lists the chapters.

- **Date:** 2026-11-11
- **Status:** Draft — awaiting owner review
- **Stack:** Next.js 16 (App Router) · React 19 · Tailwind CSS v4 · TypeScript · bun · Motion
- **Note for implementers:** this Next.js version has breaking changes. Read the relevant guide in `node_modules/next/dist/docs/` before writing code (see `AGENTS.md`).

## 1. Intent

A personal portfolio for a fullstack (Next.js) developer whose primary goal is **getting hired**. Recruiters and hiring managers should, within seconds, understand who the owner is, see strong work, and have a frictionless way to book a call, email, or grab the résumé.

The visual language is borrowed from the reference studio site (witharc.co): calm, neat, "paper-and-pencil" — warm paper background, ink typography, generous whitespace, a quiet left side nav, simple direct CTAs. **We borrow layout and feel, not brand:** no copying of the reference's logo, copy, client names, or imagery. Pricing / package / testimonials / FAQ sections from the reference are **not** included.

### Success criteria

1. Home hero layout matches reference screenshot `refs/01-hero.png` closely (structure, rhythm, two-tone type, handwritten note, CTA row).
2. Side nav behaves like the reference: active-section highlighting, pinned, and hides while full-bleed sections (carousel) are in view (`refs/08-video-nav-hide.jpg`).
3. Project detail pages match `refs/03-project-page.png`: back link in side nav, wordmark + title + paragraph, large rounded preview images with scroll blur (`refs/07-video-carousel-scrollblur.jpg`).
4. Every page uses one of two consistent hero variants (major / minor).
5. Blog index + post pages feel native to the same system.
6. Lighthouse ≥ 95 on Performance, Accessibility, Best Practices, SEO for `/` and one detail page (desktop).
7. Content is edited by changing typed data files or MDX only — no component edits needed to add a project/post/role.

### Decisions log (from brainstorming)

| Topic | Decision |
|---|---|
| Audience | Job hunting (no pricing/package) |
| Extra home sections | Experience, Stack (+ GitHub activity grid) |
| Content source | Typed TS data files; blog as MDX in repo |
| Content readiness | Clearly marked placeholders for now |
| Wordmark | First / last name, stacked lowercase, small ® style mark |
| Theme | Light default + manual dark toggle (persisted) |
| Primary CTA | "Book a call" pill → calendar link; hover/focus/tap reveals **Email** and **Résumé** |
| Animation approach | Motion (framer-motion successor, `motion` package) for scroll effects, reveals, carousel drag, nav visibility, CTA reveal |

## 2. Reference notes

Screenshots and video contact sheets are in `docs/superpowers/specs/refs/`:

| File | What to take from it |
|---|---|
| `01-hero.png` | Major hero: bold ink first line; grey multi-line statements with dotted-underlined inline links; handwritten "check this out :)" with curved arrow; dark pill + arrow-link CTA row; small grey status lines below. |
| `02-info-grid-rows.png` | Bordered 2×2 info grid (rounded outer corners, hairline inner dividers); label/content row list with dividers ("Week 1 / Brand…"). |
| `03-project-page.png` | Detail layout: side nav has "← Back" + socials only; main column wordmark, bold title, paragraph; full-width rounded image card below. |
| `04-minor-hero.png` | Secondary page hero rhythm (bold line + grey statements + CTA + small note). |
| `05-stack-github-grid.png` | (Different portfolio) Stack section: title + tiny "( hover to play )" note, filter tabs, bordered chips with mono icons; GitHub contribution grid in greyscale with legend. Restyle into our paper/ink system — do not copy its serif title font or chrome. |
| `06-video-sections.jpg` | Carousel cards; plain testimonial list (not used); Gantt-like "Launch plan" table (→ our `Timeline`); FAQ accordion (component kept, not used on home). |
| `07-video-carousel-scrollblur.jpg` | Full-bleed carousel: active card ~70vw with 1px accent outline + small accent label tag below; neighbours peek. Content blurs/fades as it leaves viewport. |
| `08-video-nav-hide.jpg` | Side nav disappears while carousel occupies the viewport, reappears after. |

## 3. Information architecture

| Route | Variant | Contents |
|---|---|---|
| `/` | major | Hero → Works (AgroHub screens carousel, `data-nav="hide"`, then a small "Pet projects & experiments →" `ArrowLink` to `/playground`) → Experience → Stack → GitHub activity → Writing (latest 3) → Contact |
| `/work/[slug]` | minor | Title, paragraph, MetaTable (role, stack, year, links), optional Timeline, preview images (ScrollBlur), "Next project →" (hidden while there is only one featured project), closing CTA. v1 has one: `/work/agrohub`. |
| `/playground` | minor | "Pet projects & experiments": a short intro, then two `RowList` groups, **Client & collaborations** and **Experiments**. Each row: role tag · name · one line · "Visit ↗" / "Code ↗". Not linked from the side nav; reached from the Works link and the footer. |
| `/blog` | major | Hero ("Writing." + grey statement), posts as RowList (date · title + summary · reading time), grouped by year |
| `/blog/[slug]` | minor | Title, date, reading time, tags, MDX article in reading column, "← All writing" |
| `not-found` | minor | Short message + links home / writing |
| `/blog/rss.xml` | — | RSS feed |
| `sitemap.ts`, `robots.ts` | — | Generated |

Side nav contents:

- **Home:** wordmark · Works · Experience · Stack · Writing · Contact · (gap) · Résumé · GitHub · LinkedIn · X · theme toggle.
- **Blog index:** wordmark · year anchors (e.g. 2026, 2025) · (gap) · "← Home" · socials · toggle.
- **Detail pages (`/work/*`, `/blog/*`):** "← {First Last}" (or "← All writing" for posts) · (gap) · socials · toggle. Wordmark sits at the top of the main column instead (per `03-project-page.png`).

## 4. Visual system

### Color tokens (CSS custom properties, exposed to Tailwind via `@theme`)

| Token | Light | Dark |
|---|---|---|
| `--paper` (bg) | `#F2EFE8` | `#171614` |
| `--paper-raised` (cards, image wells) | `#E9E5DD` | `#1F1D1A` |
| `--ink` (primary text) | `#21201D` | `#EDEAE3` |
| `--ink-muted` (two-tone grey) | `#5D5B55` | `#A29E96` |
| `--ink-faint` (meta, legends) | `#6E6C65` | `#7C7870` |
| `--line` (borders/dividers) | `#DFDCD6` | `#2E2B27` |
| `--accent` (carousel outline/tag, focus) | `#2563EB` | `#7C93F0` |
| `--pill` / `--pill-ink` | `#21201D` / `#F2EFE8` | `#EDEAE3` / `#171614` |
| Contribution levels 0–4 | `--line` → `#C9C5BD` → `#9A968F` → `#5E5B56` → `#1A1A1A` | mirrored on dark ramp |

Light values were taken from the reference site's own CSS tokens (`--page`, `--ink`, `--muted`, `--faint`, `--line`, `--blue`, `--art-well`). Hex values are otherwise starting points; the implementation must verify `--ink-muted` on `--paper` meets WCAG AA (4.5:1) at body sizes in both themes and adjust if not.

### Typography (via `next/font`)

- **Display (hero, titles):** Funnel Display (`next/font/google` `Funnel_Display`), tight tracking (−0.02em), weights 500/600. This is the face the reference uses.
- **Body / UI:** Funnel Sans (`Funnel_Sans`) at 15–17px, weight 400/500. UI labels and meta at 13px.
- **Hand:** Caveat for handwritten notes.
- **Mono:** Geist Mono for code blocks and tiny annotations.
- Scale: hero ~ `clamp(2rem, 4.2vw, 3.25rem)` with line-height 1.15; body 1rem/1.6.

### Details

- Inline links: dotted underline (`text-decoration: underline dotted; text-underline-offset: 0.2em`), ink on hover.
- Radii: cards 16px, grid 14px, pills full.
- Hairlines: 1px `--line`.
- Layout: side nav column ~240px fixed; main column max ~760px; full-bleed / breakout sections escape the main column.
- Mobile (< `md`): side nav becomes a slim top bar (wordmark + menu button) and a full-height sheet.

## 5. Components

All components are server components unless marked **(client)**.

### Layout

- **`SiteShell`** — two-column grid (`SideNav` + `<main>`), skip-to-content link, providers.
- **`SideNav`** **(client)** — props: `variant: "home" | "index" | "detail"`, `links: NavLink[]`, `back?: {href,label}`. Renders wordmark (not on detail), links, socials, `ThemeToggle`. Active link driven by `useActiveSection(ids)`. Visibility driven by `NavVisibilityContext`.
- **`useActiveSection(ids)`** **(client hook)** — IntersectionObserver with a root margin targeting the viewport's upper-middle band; returns the active id.
- **`NavVisibilityProvider` / `HideNavZone`** **(client)** — sections wrapped in `HideNavZone` (or marked `data-nav="hide"`) report when they cover the viewport centre; nav animates to `opacity 0 + blur(4px) + pointer-events none` via Motion and back.
- **`MobileNav`** **(client)** — top bar + sheet; same link data.
- **`Wordmark`** — two stacked lowercase lines + small mark; sizes `sm | md`.
- **`ThemeToggle`** **(client)** — toggles `data-theme` on `<html>` and persists to `localStorage`.

### Heroes

- **`PageHero`** — `variant: "major" | "minor"`.
  - **major:** `lead` (bold ink line), `statements[]` (grey rich-text paragraphs, may include `InlineLink`s), optional `note` slot (`HandNote`), optional `actions` slot (`CtaGroup`), optional `status` lines (small grey).
  - **minor:** `Wordmark`, `title`, `body`, optional `meta` (`MetaTable`).

### CTAs

- **`CtaGroup`** **(client)** — "Book a call" dark pill linking to `site.calendarUrl` (opens in new tab). On pointer hover, keyboard focus, or first tap on touch devices, two small chips — **Email** (`mailto:`) and **Résumé ↓** (`/resume.pdf`, downloads) — slide out beside it with Motion stagger. Collapses on pointer leave (with ~150ms grace), `Escape`, or focus leaving the group. Disclosure semantics: trigger exposes `aria-expanded` and `aria-controls`. On touch: first tap reveals, second tap on the pill follows the link.
- **`ArrowLink`** — text link with underlined label + "→" that nudges 2px on hover.
- **`InlineLink`** — dotted-underline link.

### Content blocks

- **`WorkCarousel`** **(client)** — full-bleed; active card ~70vw (max ~1100px), 16:10 rounded cover; neighbours peek. Motion `drag="x"` with snap to nearest card, prev/next buttons, ←/→ keys when focused. Active card: 1px `--accent` outline + small accent tag below ("{name} ({context})"). Cards are `<Link>`s to `/work/[slug]`. Wrapped in `HideNavZone`. **Slides are generic `{ image, tag, href }`.** In v1 the home page feeds it AgroHub's `slides` (one per screen; tag = "AgroHub · {screen}", e.g. "AgroHub · Price board"), all linking to `/work/agrohub`. Once there are 2+ featured projects, it takes each project's cover instead. No component change needed.
- **`InfoGrid`** — bordered 2×N grid of `{title, body}`.
- **`RowList`** — rows of `{label, title, body?, aside?, href?}` with hairline dividers. Used for Experience (label = years; title = role · company; body = one-liner; aside = location/type) and blog index (label = date; aside = reading time).
- **`MetaTable`** — key/value table for project and post meta.
- **`Timeline`** — Gantt-style table: columns = weeks/phases, rows = tracks, bars spanning columns (rounded, `--paper-raised` with `--line` border). Used optionally on project pages.
- **`Accordion`** **(client)** — built and available; not placed on home in v1.
- **`ScrollBlur`** **(client)** — wraps children; Motion `useScroll({ target, offset: ["start end", "end start"] })` mapped via `useTransform` to `filter: blur(8px→0→0→8px)` and `opacity(0.4→1→1→0.4)` across [0, 0.25, 0.75, 1]. Used on project/post images and on home sections as they exit.
- **`StackGrid`** **(client)** — title + `HandNote` "(hover to play)"; filter tabs (All / Frontend / Backend / Design / Tools); chips `{name, icon, category}` with hairline border and mono icon. Filtering uses Motion `layout` + `AnimatePresence`; chip hover = small rotate/jiggle spring.
- **`ContribGrid`** — server-rendered SVG, 53×7 cells, month labels, "N contributions in the last year", Less→More legend; a small **(client)** tooltip shows date + count on hover/focus.
- **`HandNote`** **(client)** — Caveat text + SVG arrow whose path draws in via Motion `pathLength` when in view.
- **`PostCard` / `PostRow`** — for home "Writing" (latest 3) and the blog index.
- **`Prose`** — MDX styling wrapper for the article column (headings, lists, blockquotes, code with syntax highlighting, images wrapped in `ScrollBlur`).

### Reduced motion

All Motion effects check `useReducedMotion()`: no blur, no wiggle, no drag inertia, no path drawing; instant state changes only.

## 6. Data

Types live in `content/types.ts`. Real content comes from `2026-11-11-content-inventory.md`; anything still unconfirmed there gets an obvious placeholder (`TODO(content)` comments).

- **`content/site.ts`** — `{ firstName, lastName, role, email, calendarUrl, socials: {github, linkedin, x}, githubUsername, hero: { lead, statements, status } }`.
- **`content/playground.ts`** — `PlaygroundItem[]`: `{ name, group: "client" | "experiment", role: "Built end-to-end" | "Collaborated · fullstack" | "Collaborated · frontend" | "Solo", summary, url?, repo? }`. Rendered on `/playground`.
- **`content/projects.ts`** — featured projects only (v1: AgroHub). `Project[]`: `{ slug, name, context, summary, cover: {src, alt}, slides: {src, alt, screen}[], role, stack[], year, status: "in-progress" | "shipped", links: {live?, repo?}, images: {src, alt, caption?}[], timeline? }`. Array order = carousel order; "next project" wraps around and only renders when there are 2+ projects.
- **`content/experience.ts`** — `Role[]`: `{ start, end | "Present", title, company, companyUrl?, summary, location? }`.
- **`content/stack.ts`** — `StackItem[]`: `{ name, category: "frontend"|"backend"|"design"|"tools", icon }`. Icons are inline SVG components (simple-icons paths or similar), rendered monochrome via `currentColor`.
- **`content/blog/*.mdx`** — frontmatter `{ title, date (ISO), summary, tags[], draft? }`, validated with zod at build time. Drafts are excluded in production. Reading time is computed from word count (≈ 220 wpm).
- **MDX pipeline** — `@next/mdx` with posts loaded via dynamic `import()` of `content/blog/<slug>.mdx` and frontmatter exported/parsed per post; syntax highlighting with Shiki (`@shikijs/rehype`, build-time). Fall back to `next-mdx-remote` only if the bundled Next 16 docs show `@next/mdx` cannot support this pattern.
- **GitHub contributions** — `lib/github.ts` calls GitHub GraphQL `user(login).contributionsCollection.contributionCalendar` with `GITHUB_TOKEN` (server-only env var), cached and revalidated every 24h. With no token or a failed request, it returns a deterministic seeded placeholder calendar flagged `isSample: true`, rendered with a small "sample data" caption.
- **Résumé PDF (generated, never hand-edited)** — `app/resume.pdf/route.ts` renders a one-page A4 résumé with `@react-pdf/renderer` from the same content files (`site`, `experience` + education, `stack`, the featured `projects`, plus one line pointing to the playground page). It's statically generated at build time, so it's always in sync with the site, and it's served with `Content-Disposition: attachment; filename="Destine-Jonathan-Resume.pdf"` so clicking it downloads the file. Layout: paper/ink typography that matches the site, in black and white so it prints cleanly. Phone number omitted. A Vitest test checks that the route returns a valid PDF (`%PDF` header, non-zero size) that includes the owner's name.
- **Static assets** — `/public/work/<slug>/*` images.

## 7. Theming implementation

- Tokens are defined in `app/globals.css` under `:root` and `[data-theme="dark"]`, and mapped in a Tailwind v4 `@theme` block (e.g. `--color-paper: var(--paper)`).
- A blocking inline script in `app/layout.tsx` `<head>` sets `document.documentElement.dataset.theme` from `localStorage.theme`, falling back to `prefers-color-scheme`, before paint. `<html suppressHydrationWarning>`.
- `ThemeToggle` updates the attribute and `localStorage`.

## 8. Accessibility

- Landmarks: `nav[aria-label="Primary"]`, `main#content`, skip link.
- Visible focus rings using `--accent`.
- Carousel: `role="region"` + `aria-roledescription="carousel"` + label; slides are links; keyboard ←/→; live region announces the active slide name.
- `CtaGroup` is fully operable by keyboard (focus reveals chips; Tab reaches them).
- Contrast AA in both themes; hidden-nav state uses `inert`/`aria-hidden` while invisible.
- Images require alt text (type-enforced).

## 9. SEO & metadata

- `metadata` / `generateMetadata` on every route (title template `"%s — First Last"`).
- `opengraph-image.tsx` for `/`, `/work/[slug]`, `/blog/[slug]` using `next/og` in the paper/ink style.
- `sitemap.ts`, `robots.ts`, RSS at `/blog/rss.xml`.
- `generateStaticParams` for all project and post slugs.

## 10. Error handling

- Unknown project or post slug → `notFound()` → shared `not-found.tsx` (minor variant).
- GitHub fetch failure or missing token → placeholder grid; never throws.
- Invalid MDX frontmatter → build fails with a clear zod error naming the file.
- Missing image → typed data makes it a compile error where possible.

## 11. Testing & verification

- **Unit (Vitest):** post sorting/grouping, reading time, frontmatter validation, next-project wraparound, GitHub response → grid weeks mapping, placeholder generator determinism.
- **E2E (Playwright, `--trace off`):**
  - home renders; clicking a nav link scrolls there and marks it active
  - nav hidden while carousel in view, visible after
  - CTA reveals Email/Résumé on hover and on keyboard focus; Escape collapses
  - carousel arrow keys change the active slide; clicking the active card navigates to its detail page
  - theme toggle persists across reload with no flash
  - `/work/[slug]`, `/blog`, `/blog/[slug]` render; unknown slugs return 404
  - reduced-motion emulation disables blur
- **Visual:** screenshots of each route at desktop (1440) and phone (iPhone 13) in both themes, reviewed against `refs/`.
- **Gate per task:** `bun run lint`, `bunx tsc --noEmit`, `bun run build` all pass.

## 12. Proposed file structure

```
app/
  layout.tsx            # fonts, theme script, SiteShell
  globals.css           # tokens, @theme, prose
  page.tsx              # home
  work/[slug]/page.tsx
  work/[slug]/opengraph-image.tsx
  blog/page.tsx
  blog/[slug]/page.tsx
  blog/[slug]/opengraph-image.tsx
  blog/rss.xml/route.ts
  not-found.tsx
  sitemap.ts
  robots.ts
components/
  layout/   SiteShell, SideNav, MobileNav, Wordmark, ThemeToggle, NavVisibility
  hero/     PageHero, HandNote
  cta/      CtaGroup, ArrowLink, InlineLink
  blocks/   InfoGrid, RowList, MetaTable, Timeline, Accordion
  work/     WorkCarousel, ProjectGallery
  motion/   ScrollBlur
  stack/    StackGrid, StackIcon
  github/   ContribGrid, ContribTooltip
  blog/     PostRow, Prose, mdx-components
content/    site.ts, projects.ts, playground.ts, experience.ts, stack.ts, types.ts, blog/*.mdx
lib/        posts.ts, github.ts, reading-time.ts, use-active-section.ts
app/resume.pdf/route.ts, lib/resume/ResumeDocument.tsx
public/     work/<slug>/*
tests/      unit/*, e2e/*
```

## 13. Out of scope (v1)

CMS, comments, analytics, site search, newsletter, i18n, testimonials/FAQ on home, pricing pages.

## 14. Open items for the owner (non-blocking)

See the **(confirm)** markers in `2026-11-11-content-inventory.md`. Also needed: a `GITHUB_TOKEN` (read-only, no scopes) in the deployment environment.
