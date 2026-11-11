# Portfolio Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build Destine Jonathan's job-hunting portfolio: a calm "paper and ink" Next.js 16 site with a home page, an AgroHub case study, a playground page, an MDX blog and a generated résumé PDF.

**Architecture:** App Router, rendered on the server by default. All content lives in typed files under `content/`, and blog posts are MDX. Interactive behaviour (side-nav visibility and active section, CTA reveal, carousel, scroll blur, stack filter, theme toggle) lives in small client components built on Motion. Cache Components is on, so cached data uses `'use cache'` + `cacheLife`.

**Tech Stack:** Next.js 16.4.6 (Turbopack, `cacheComponents: true`), React 19.3, TypeScript 5, Tailwind CSS 4.3, bun 1.4, `motion` 14, `zod` 4, `@next/mdx` 16.4.6 + `@shikijs/rehype` 4, `@react-pdf/renderer` 4, `simple-icons` 16, Vitest 5 + Testing Library + jsdom, `@playwright/test` **1.63.0**.

**Spec:** `docs/superpowers/specs/2026-11-11-portfolio-redesign-design.md`. Content: `docs/superpowers/specs/2026-11-11-content-inventory.md`. Visual references: `docs/superpowers/specs/refs/`.

## Global Constraints

- Read the matching guide in `node_modules/next/dist/docs/` before using any Next API (see `AGENTS.md`). Pages receive `params` as a `Promise`, so always `await params`.
- `cacheComponents: true` stays on. Never export `dynamic`, `revalidate` or `fetchCache`. Cache with `'use cache'` + `cacheLife(...)` inside the function. No `Date.now()`, `new Date()` (without an argument), `Math.random()` or `crypto.randomUUID()` in server code that prerenders.
- MDX plugins go in `next.config.ts` as **string names** with serializable options only (Turbopack requirement).
- Motion is imported from `motion/react`. Every animation honours `useReducedMotion()`: with reduced motion on, nothing blurs, wiggles, drags with inertia or draws in.
- Pin `@playwright/test` to `1.63.0` so it matches the preinstalled Chromium. Run Playwright with `--trace off`.
- Commits are authored "Destine Jonathan <jonathandestinec@gmail.com>", with **no AI attribution** of any kind: no `Co-Authored-By`, no session links, no "Generated with" footer (`CLAUDE.md`). Messages use conventional style.
- **Colour tokens** (light / dark):
  - `--paper` `#F2EFE8` / `#171614`
  - `--paper-raised` `#E9E5DD` / `#1F1D1A`
  - `--ink` `#21201D` / `#EDEAE3`
  - `--ink-muted` `#5D5B55` / `#A29E96`
  - `--ink-faint` `#6E6C65` / `#7C7870`
  - `--line` `#DFDCD6` / `#2E2B27`
  - `--accent` `#2563EB` / `#7C93F0`
  - `--pill` `#21201D` / `#EDEAE3`
  - `--pill-ink` `#F2EFE8` / `#171614`
- **Fonts:** Funnel Display (headings), Funnel Sans (body), Caveat (hand notes), Geist Mono (code), all from `next/font/google`.
- **Identity:** wordmark `destine` / `jonathan`; role "FullStack Developer & Automation Engineer"; email `jonathandestinec@gmail.com`; calendar `https://cal.com/destine-jonathan-cvcewa/15min`; GitHub `jonathandestinec`; LinkedIn `https://linkedin.com/in/jonathandestinec`; X `https://x.com/destine0_`.
- Publish no phone number anywhere.
- Every task ends green on: `bun run lint`, `bun run typecheck`, `bun run test`, `bun run build`. Tasks that add e2e tests also run `bun run test:e2e`.

## Review Focus

1. **JavaScript disabled, or JS slow to load:** content stays fully visible and readable. Never ship `opacity:0` or a blur in the server HTML (ScrollBlur's starting values are applied only on the client, after mount). Test in Task 6.
2. **Touch devices (no hover):** the "Book a call" CTA must still reveal Email and Résumé (first tap reveals, second tap follows the link), and the carousel must swipe. Test in Tasks 5 and 7.
3. **Phone widths (≤ 390px):** no horizontal page scroll on any route, even with the full-bleed carousel and long stack chips. Test in Task 16.
4. **First paint in dark mode:** a saved `dark` theme must never flash light (the inline script runs before paint). Test in Task 2.
5. **GitHub token missing or the API failing at build:** the build still passes and the grid shows sample data labelled "sample data". Test in Task 10.

---

## File map

```
app/layout.tsx                 fonts, <ThemeScript/>, NavVisibilityProvider, skip link
app/globals.css                tokens, @theme, base, .prose
app/page.tsx                   home
app/work/[slug]/page.tsx       case study (+ opengraph-image.tsx)
app/playground/page.tsx
app/blog/page.tsx, app/blog/[slug]/page.tsx (+ opengraph-image.tsx), app/blog/rss.xml/route.ts
app/resume.pdf/route.ts
app/not-found.tsx, app/sitemap.ts, app/robots.ts, app/opengraph-image.tsx
mdx-components.tsx
components/layout/   SiteShell.tsx SideNav.tsx MobileNav.tsx Wordmark.tsx ThemeToggle.tsx ThemeScript.tsx nav-visibility.tsx
components/hero/     PageHero.tsx HandNote.tsx
components/cta/      CtaGroup.tsx ArrowLink.tsx InlineLink.tsx
components/blocks/   InfoGrid.tsx RowList.tsx MetaTable.tsx Timeline.tsx Accordion.tsx Section.tsx
components/motion/   ScrollBlur.tsx
components/work/     WorkCarousel.tsx
components/stack/    StackGrid.tsx StackIcon.tsx
components/github/   ContribGrid.tsx ContribTooltip.tsx
components/blog/     PostRow.tsx Prose.tsx
content/             types.ts site.ts projects.ts experience.ts stack.ts playground.ts blog/*.mdx
lib/                 content.ts posts.ts reading-time.ts github.ts theme.ts use-active-section.ts resume/ResumeDocument.tsx resume/build.ts
scripts/capture-screenshots.ts
public/work/agrohub/*.png
tests/unit/*.test.ts(x)   tests/e2e/*.spec.ts
```

---

### Task 1: Tooling and test harness

**Files:**
- Modify: `package.json`, `next.config.ts`, `.gitignore`
- Create: `vitest.config.mts`, `tests/setup.ts`, `playwright.config.ts`, `tests/unit/smoke.test.ts`, `tests/e2e/smoke.spec.ts`
- Replace: `app/page.tsx` (a minimal `<main><h1>destine jonathan</h1></main>`); delete the `public/*.svg` scaffold files

**Interfaces:**
- Produces scripts: `typecheck` = `tsc --noEmit`, `test` = `vitest run`, `test:e2e` = `playwright test --trace off`, `capture` = `bun scripts/capture-screenshots.ts`.

- [ ] **Step 1:** `bun add motion zod @next/mdx @mdx-js/loader @mdx-js/react @shikijs/rehype shiki @react-pdf/renderer simple-icons` and `bun add -d vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @types/mdx @playwright/test@1.63.0`.
- [ ] **Step 2:** Add the scripts above. Vitest: environment `jsdom`, `@/` alias to the repo root, setup file imports `@testing-library/jest-dom/vitest`, `include: ['tests/unit/**/*.test.{ts,tsx}']`. Playwright: `testDir: tests/e2e`; `webServer` runs `bun run build && bun run start -p 3100`, `url: http://localhost:3100`, `reuseExistingServer: true`; projects `desktop` (1440×900) and `phone` (`devices['iPhone 13']` with `browserName: 'chromium'`). Add `/test-results`, `/playwright-report` to `.gitignore`.
- [ ] **Step 3:** Write `smoke.test.ts` (`expect(1+1).toBe(2)`) and `smoke.spec.ts` (`/` responds 200 and has `h1`).
- [ ] **Step 4:** Run `bun run test && bun run test:e2e`. Expected: both pass.
- [ ] **Step 5:** Run `bun run lint && bun run typecheck && bun run build`. Expected: clean.
- [ ] **Step 6:** Commit `chore: add test tooling and dependencies`.

---

### Task 2: Design tokens, fonts and theme

**Files:**
- Modify: `app/globals.css`, `app/layout.tsx`
- Create: `lib/theme.ts`, `components/layout/ThemeScript.tsx`, `components/layout/ThemeToggle.tsx`
- Test: `tests/unit/theme.test.ts`, `tests/e2e/theme.spec.ts`

**Interfaces:**
- Produces:
  - `type Theme = 'light' | 'dark'`
  - `resolveTheme(stored: string | null, prefersDark: boolean): Theme`
  - `THEME_STORAGE_KEY = 'theme'`
  - `themeInitScript: string` (an IIFE that sets `document.documentElement.dataset.theme`)
  - `<ThemeScript/>` (server component, `<script dangerouslySetInnerHTML>`)
  - `<ThemeToggle/>` (client; `aria-label="Toggle dark mode"`, `aria-pressed`)
  - Tailwind colours `paper paper-raised ink ink-muted ink-faint line accent pill pill-ink`
  - fonts `font-display font-sans font-hand font-mono`

- [ ] **Step 1: Write the failing unit test**

```ts
import { resolveTheme } from '@/lib/theme'
test('stored value wins', () => { expect(resolveTheme('dark', false)).toBe('dark'); expect(resolveTheme('light', true)).toBe('light') })
test('falls back to system', () => { expect(resolveTheme(null, true)).toBe('dark'); expect(resolveTheme(null, false)).toBe('light') })
test('ignores junk', () => { expect(resolveTheme('purple', false)).toBe('light') })
```

- [ ] **Step 2:** `bun run test tests/unit/theme.test.ts`. Expected: FAIL (module not found).
- [ ] **Step 3:** Implement `lib/theme.ts`. `themeInitScript` reads `localStorage` inside try/catch and inlines the same logic as `resolveTheme`.
- [ ] **Step 4:** Rewrite `globals.css`:
  - tokens under `:root` and `[data-theme="dark"]` (values from Global Constraints)
  - `@theme inline` mapping `--color-*` and `--font-*`
  - `body { background: var(--paper); color: var(--ink); font-family: var(--font-sans) }`
  - `a.dotted { text-decoration: underline dotted; text-underline-offset: .2em }`
  - `::selection` in `--accent` at 20% opacity
  - `:focus-visible { outline: 2px solid var(--accent); outline-offset: 2px }`
- [ ] **Step 5:** In `app/layout.tsx`:
  - load `Funnel_Display({weight:['500','600'], variable:'--font-display'})`, `Funnel_Sans({variable:'--font-sans'})`, `Caveat({variable:'--font-hand'})` and `Geist_Mono({variable:'--font-mono'})`
  - set `<html lang="en" suppressHydrationWarning>` and put `<ThemeScript/>` first in `<head>`
  - add a skip link `<a href="#content">Skip to content</a>` (visible on focus only)
  - set metadata `title: { default: 'Destine Jonathan — FullStack Developer & Automation Engineer', template: '%s — Destine Jonathan' }`
- [ ] **Step 6:** Write `theme.spec.ts`:
  - clicking the toggle sets `html[data-theme="dark"]` and survives a reload
  - with `localStorage.theme='dark'` set by `addInitScript`, the first screenshot pixel at (5,5) is dark (R < 60), which guards against the flash (Review Focus 4)
  - the test page temporarily mounts `<ThemeToggle/>` in `app/page.tsx`
- [ ] **Step 7:** Run `bun run test && bun run test:e2e`. Expected: PASS.
- [ ] **Step 8:** Commit `feat: add paper/ink tokens, fonts and theme toggle`.

---

### Task 3: Content model and data

**Files:**
- Create: `content/types.ts`, `content/site.ts`, `content/projects.ts`, `content/experience.ts`, `content/stack.ts`, `content/playground.ts`, `lib/content.ts`
- Test: `tests/unit/content.test.ts`

**Interfaces:**
- Produces (in `content/types.ts`):

```ts
type Img = { src: string; alt: string }
type Site = { firstName: string; lastName: string; role: string; email: string; calendarUrl: string; githubUsername: string;
  socials: { github: string; linkedin: string; x: string }; hero: { lead: string; statements: RichText[]; status: string[] } }
type RichText = Array<string | { text: string; href: string }>
type Slide = Img & { screen: string }
type Project = { slug: string; name: string; context: string; summary: string; cover: Img; slides: Slide[]; role: string;
  stack: string[]; year: string; status: 'in-progress' | 'shipped'; links: { live?: string; repo?: string };
  images: (Img & { caption?: string })[]; timeline?: Timeline }
type Timeline = { columns: string[]; rows: { track: string; start: number; span: number }[] }
type Role = { start: string; end: string; title: string; company: string; summary: string; location?: string }
type Education = { date: string; course: string; institution: string; location: string }
type StackCategory = 'frontend' | 'backend' | 'tools' | 'design'
type StackItem = { name: string; category: StackCategory; icon: string }  // icon = simple-icons slug or 'terminal' | 'key'
type PlaygroundItem = { name: string; group: 'client' | 'experiment'; role: string; summary: string; stack?: string[]; url?: string; repo?: string }
```

- Produces (in `lib/content.ts`):
  - `getProject(slug: string): Project | undefined`
  - `getNextProject(slug: string): Project | null` (null when fewer than 2 projects)
  - `homeSlides(): { image: Img; tag: string; href: string }[]`: when 1 project, its slides with tag `"AgroHub · {screen}"`; when 2+, each project's cover with tag `"{name} ({context})"`
  - `filterStack(items: StackItem[], cat: StackCategory | 'all'): StackItem[]`
  - `groupPlayground(items): { client: PlaygroundItem[]; experiment: PlaygroundItem[] }`

- [ ] **Step 1: Write the failing tests**

```ts
test('one featured project → slides tagged by screen', () => {
  const s = homeSlides(); expect(s.length).toBeGreaterThanOrEqual(3)
  expect(s[0].tag).toBe('AgroHub · Landing'); expect(s.every(x => x.href === '/work/agrohub')).toBe(true) })
test('next project hidden with one project', () => expect(getNextProject('agrohub')).toBeNull())
test('unknown slug', () => expect(getProject('nope')).toBeUndefined())
test('stack filter', () => { expect(filterStack(stack,'all')).toHaveLength(stack.length)
  expect(filterStack(stack,'tools').map(s=>s.name)).toContain('n8n') })
test('playground groups', () => { const g = groupPlayground(playground)
  expect(g.client.map(i=>i.name)).toContain('Thymus Energy FZCO'); expect(g.experiment.map(i=>i.name)).toContain('RefillRx') })
test('no phone numbers in content', () => expect(JSON.stringify({site,projects,experience,playground})).not.toMatch(/\+?234\d{6,}/))
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Fill the data files **verbatim from the content inventory**:
  - Experience order: Welup Digital (Aug 2026–Present, Software Development Intern); GIZ (Aug 2026–Present, AI & Automations Engineering); Nexorra Studio; Caretrax; JoeNadiv Concepts. Education goes in a separate `education` export.
  - Stack: exactly the inventory list. The `icon` slugs come from simple-icons (`nextdotjs react typescript astro tailwindcss reactquery axios nodedotjs express bun mongodb postgresql prisma drizzle socketdotio clerk jsonwebtokens auth0 n8n docker git github vercel figma redux`), with `'terminal'` for CLI, `'key'` for OAuth and `'zustand'` falling back to `'key'` if it's missing. Verify each slug exists in `simple-icons` and fall back to `'key'` otherwise.
  - AgroHub slides: `Landing` (`/work/agrohub/landing.png`), `Browse lots` (`lots.png`), `Price board` (`prices.png`), `Landing on a phone` (`landing-phone.png`). The case-study `images` reuse these plus `lots-phone.png`.
  - AgroHub `timeline`: columns `['Spec','Identity & auth','Lots & offers','Payments & payouts','i18n & polish']`, rows `Design/Build/Test` spanning plausibly. Mark it `// TODO(content): confirm with owner`.
  - `site.hero`:
    - `lead`: "Hi, I'm Destine."
    - statements:
      - "I build fullstack web apps and the automations behind them."
      - "Right now: [AgroHub], helping farmer cooperatives in Nigeria sell together and get paid on delivery." (AgroHub links to `/work/agrohub`)
      - "I work in Next.js, Postgres, and n8n."
    - status: `['Open to fullstack roles.', 'Based in Nigeria · remote friendly.']`
- [ ] **Step 4:** Implement `lib/content.ts`. Run tests. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add typed content model and data`.

---

### Task 4: Layout shell and side nav

**Files:**
- Create: `components/layout/{SiteShell,SideNav,MobileNav,Wordmark,nav-visibility}.tsx`, `lib/use-active-section.ts`, `components/blocks/Section.tsx`
- Modify: `app/layout.tsx` (wrap in `NavVisibilityProvider`)
- Test: `tests/e2e/nav.spec.ts`

**Interfaces:**
- Consumes: `site` from Task 3, `ThemeToggle` from Task 2.
- Produces:
  - `type NavLink = { href: string; label: string }`
  - `<SiteShell variant="home"|"index"|"detail" links?: NavLink[] back?: NavLink>{children}</SiteShell>`: grid `md:grid-cols-[240px_minmax(0,1fr)]`; main is `<main id="content">` with an inner column `max-w-[760px]`. Children may break out with the `.bleed` utility (`width:100vw; margin-left:calc(50% - 50vw)`, defined in globals.css).
  - `<Wordmark size="sm"|"md"/>`
  - `useActiveSection(ids: string[]): string | null`: an IntersectionObserver with `rootMargin: '-35% 0px -55% 0px'`
  - `NavVisibilityProvider` and `useNavHidden(): boolean`
  - `<HideNavZone>{children}</HideNavZone>`: hides the nav while it intersects the band `rootMargin: '-45% 0px -45% 0px'`
  - `<Section id title? hideNav?>`: a `<section id aria-labelledby>` with a title in `text-[13px] text-ink-faint`; with `hideNav`, it wraps the children in `HideNavZone`.
- SideNav details:
  - Fixed (`md:sticky top-0 h-svh`); hidden below `md`.
  - When `useNavHidden()` is true, animate to `{opacity:0, filter:'blur(4px)'}` and set `inert`.
  - The active link gets `text-ink` and `aria-current="true"`; other links are `text-ink-muted`.
  - Socials order: Résumé (`/resume.pdf`, `download`), GitHub, LinkedIn, X (external links get `target="_blank" rel="noreferrer"`), then `ThemeToggle`.
- MobileNav: a sticky top bar below `md` (Wordmark sm + a "Menu" button) opening a full-height sheet with the same links. Escape closes it, and focus returns to the button.

- [ ] **Step 1: Write the failing e2e test.** Use a temporary `app/page.tsx` with three tall `Section`s (`works` with `hideNav`, `experience`, `stack`).

```ts
test('active link follows scroll', async ({ page }) => { await page.goto('/')
  await page.locator('#experience').scrollIntoViewIfNeeded(); await page.waitForTimeout(400)
  await expect(page.getByRole('link', { name: 'Experience' })).toHaveAttribute('aria-current', 'true') })
test('nav hides over works', async ({ page }) => { await page.goto('/')
  await page.locator('#works').evaluate(e => e.scrollIntoView({ block: 'center' })); await page.waitForTimeout(500)
  await expect(page.locator('nav[aria-label="Primary"]')).toHaveCSS('opacity', '0') })
test('mobile menu opens and closes', async ({ page, isMobile }) => { test.skip(!isMobile)
  await page.goto('/'); await page.getByRole('button', { name: 'Menu' }).click()
  await expect(page.getByRole('dialog')).toBeVisible(); await page.keyboard.press('Escape'); await expect(page.getByRole('dialog')).toBeHidden() })
```

- [ ] **Step 2:** `bun run test:e2e tests/e2e/nav.spec.ts`. Expected: FAIL.
- [ ] **Step 3:** Implement the components to the interfaces above.
- [ ] **Step 4:** Run. Expected: PASS on desktop and phone.
- [ ] **Step 5:** Commit `feat: add site shell, side nav and mobile nav`.

---

### Task 5: Hero, links and CTA

**Files:**
- Create: `components/hero/{PageHero,HandNote}.tsx`, `components/cta/{CtaGroup,ArrowLink,InlineLink}.tsx`
- Test: `tests/unit/rich-text.test.tsx`, `tests/e2e/cta.spec.ts`

**Interfaces:**
- Consumes: `RichText`, `site`.
- Produces:
  - `<PageHero variant="major" lead statements note? actions? status?/>`
  - `<PageHero variant="minor" title body? meta?/>`. The minor variant renders `Wordmark` above the title.
  - `renderRichText(rt: RichText): ReactNode` (exported from `PageHero.tsx`): link parts become `InlineLink`
  - `<InlineLink href>`: dotted underline
  - `<ArrowLink href external?>label</ArrowLink>`: appends " →", or " ↗" when external
  - `<HandNote text arrow?="up-left"|"left">`
  - `<CtaGroup/>`: no props; reads `site`
- Typography:
  - Major `lead`: `font-display font-semibold text-ink text-[clamp(2rem,4.2vw,3.25rem)] leading-[1.15] tracking-[-0.02em]`.
  - Statements: the same size in `text-ink-muted font-medium`, `space-y-[1.1em]`. Status lines: `text-[15px] text-ink-muted mt-6`.
- CtaGroup behaviour (from the spec):
  - The pill is an `<a href={calendarUrl} target="_blank" rel="noreferrer">` reading "Book a call", with `aria-expanded` and `aria-controls="cta-more"`.
  - Chips: "Email" (`mailto:`) and "Résumé ↓" (`/resume.pdf`, `download`).
  - Open on `pointerenter` or `focus` within the group. Close after 150ms of `pointerleave`, on Escape, or when focus leaves the group.
  - **Touch:** if `pointerType === 'touch'` and the group is closed, `preventDefault` the first click and open; the second click follows the link.
  - Motion stagger of 0.05s, chips sliding from x:-6.

- [ ] **Step 1: Write the failing tests**

```tsx
test('renderRichText links', () => { render(<p>{renderRichText(['Now: ', { text: 'AgroHub', href: '/work/agrohub' }])}</p>)
  expect(screen.getByRole('link', { name: 'AgroHub' })).toHaveAttribute('href', '/work/agrohub') })
```

```ts
test('hover reveals chips', async ({ page, isMobile }) => { test.skip(isMobile); await page.goto('/')
  await page.getByRole('link', { name: 'Book a call' }).hover()
  await expect(page.getByRole('link', { name: 'Email' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Résumé/ })).toHaveAttribute('href', '/resume.pdf') })
test('keyboard focus reveals, Escape hides', async ({ page, isMobile }) => { test.skip(isMobile); await page.goto('/')
  await page.getByRole('link', { name: 'Book a call' }).focus(); await expect(page.getByRole('link', { name: 'Email' })).toBeVisible()
  await page.keyboard.press('Escape'); await expect(page.getByRole('link', { name: 'Email' })).toBeHidden() })
test('touch: first tap reveals, does not navigate', async ({ page, isMobile }) => { test.skip(!isMobile); await page.goto('/')
  await page.getByRole('link', { name: 'Book a call' }).tap(); await expect(page).toHaveURL(/\/$/)
  await expect(page.getByRole('link', { name: 'Email' })).toBeVisible() })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Put a major `PageHero` + `CtaGroup` + `HandNote` ("check this out :)", pointing at the AgroHub link) on the home page. Match `refs/01-hero.png`.
- [ ] **Step 4:** Run unit + e2e. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add page hero, hand note and CTA group`.

---

### Task 6: ScrollBlur and content blocks

**Files:**
- Create: `components/motion/ScrollBlur.tsx`, `components/blocks/{InfoGrid,RowList,MetaTable,Timeline,Accordion}.tsx`
- Test: `tests/unit/blocks.test.tsx`, `tests/e2e/no-js.spec.ts`

**Interfaces:**
- Produces:
  - `<ScrollBlur as?="div">`: before mount it renders plain children with no inline style. After mount it uses `useScroll({target, offset:['start end','end start']})`, mapping `[0,.25,.75,1]` to blur `[8,0,0,8]px` and opacity `[.4,1,1,.4]`. With reduced motion it renders plain children.
  - `<InfoGrid items: {title:string; body:string}[] cols?=2/>`: a `rounded-[14px] border border-line` grid with hairline inner dividers (`refs/02-info-grid-rows.png`)
  - `<RowList rows: {label:string; title:string; body?:string; aside?:ReactNode; href?:string; tag?:string}[]/>`: two columns `grid-cols-[140px_1fr]` on `md` and stacked on phones; `border-t border-line` per row
  - `<MetaTable rows: [string, ReactNode][]/>`
  - `<Timeline t: Timeline/>`: CSS grid with `columns.length` columns; bars `rounded-md border border-line bg-paper-raised` placed with `gridColumn: start / span`
  - `<Accordion items: {q:string; a:ReactNode}[]/>`: native `<details>`/`<summary>`, so it works without JS

- [ ] **Step 1: Write the failing tests**

```tsx
test('RowList renders link rows', () => { render(<RowList rows={[{ label: '2026', title: 'X', href: '/x' }]} />)
  expect(screen.getByRole('link', { name: /X/ })).toHaveAttribute('href', '/x') })
test('Timeline places bars', () => { const { container } = render(<Timeline t={{ columns: ['a','b','c'], rows: [{ track: 'Build', start: 2, span: 2 }] }} />)
  expect(container.querySelector('[data-bar]')).toHaveStyle({ gridColumn: '2 / span 2' }) })
test('ScrollBlur SSR output has no blur', () => {
  expect(renderToString(<ScrollBlur><img alt="" /></ScrollBlur>)).not.toMatch(/blur|opacity/) })
```

```ts
test.use({ javaScriptEnabled: false })
test('home readable without JS', async ({ page }) => { await page.goto('/')
  await expect(page.locator('h1, [data-hero-lead]').first()).toBeVisible()
  const hidden = await page.$$eval('main *', els => els.filter(e => getComputedStyle(e).opacity === '0').length)
  expect(hidden).toBe(0) })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run unit + e2e. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add scroll blur and content blocks`.

---

### Task 7: Work carousel

**Files:**
- Create: `components/work/WorkCarousel.tsx`
- Test: `tests/e2e/carousel.spec.ts`

**Interfaces:**
- Consumes: `homeSlides()` (Task 3), `HideNavZone` (Task 4).
- Produces: `<WorkCarousel slides: { image: Img; tag: string; href: string }[]/>`
- Behaviour:
  - **Layout:** full-bleed (`.bleed`); the track is a Motion `drag="x"` element. Cards are `w-[min(70vw,1100px)] aspect-[16/10] rounded-2xl overflow-hidden` with a 24px gap, and the first card is centred.
  - **Snapping:** on drag end, snap to the nearest index using a spring (`stiffness: 300, damping: 35`).
  - **Controls:** prev/next buttons, labelled "Previous slide" and "Next slide". ←/→ work while the region has focus.
  - **Region:** `role="region" aria-roledescription="carousel" aria-label="AgroHub screens"`, plus a polite live region announcing `tag`.
  - **Active card:** `outline outline-1 outline-accent` and a tag chip below it (`bg-accent text-white text-[11px] rounded px-1.5 py-0.5`). Each card is a `next/link` to `href`, using `next/image` with `sizes="70vw"`, and the first slide gets `priority`.
  - **Drag vs click:** a drag longer than 6px suppresses the click.

- [ ] **Step 1: Write the failing test**

```ts
test('arrow keys move active slide', async ({ page, isMobile }) => { test.skip(isMobile); await page.goto('/')
  const region = page.getByRole('region', { name: 'AgroHub screens' }); await region.focus()
  await page.keyboard.press('ArrowRight'); await expect(region.locator('[aria-current="true"]')).toContainText('Browse lots') })
test('click active card opens case study', async ({ page }) => { await page.goto('/')
  await page.getByRole('region', { name: 'AgroHub screens' }).locator('[aria-current="true"] a').click()
  await expect(page).toHaveURL(/\/work\/agrohub$/) })
test('swipe on touch moves slide', async ({ page, isMobile }) => { test.skip(!isMobile); await page.goto('/')
  const box = (await page.getByRole('region', { name: 'AgroHub screens' }).boundingBox())!
  await page.mouse.move(box.x + box.width * .8, box.y + 100); await page.mouse.down()
  await page.mouse.move(box.x + box.width * .1, box.y + 100, { steps: 8 }); await page.mouse.up()
  await expect(page.getByRole('region', { name: 'AgroHub screens' }).locator('[aria-current="true"]')).toContainText('Browse lots') })
```

- [ ] **Step 2:** Run. Expected: FAIL. (The click test also fails until Task 13, so keep it `test.fixme` until then.)
- [ ] **Step 3:** Implement. Placeholder slide images can be paper-coloured until Task 8 lands.
- [ ] **Step 4:** Run. Expected: PASS (except the fixme'd test).
- [ ] **Step 5:** Commit `feat: add work carousel`.

---

### Task 8: AgroHub screenshots

**Files:**
- Create: `scripts/capture-screenshots.ts`, `public/work/agrohub/{landing,lots,prices,landing-phone,lots-phone}.png`

**Interfaces:**
- Produces: the image paths referenced by `content/projects.ts`.

- [ ] **Step 1:** Write the script with `@playwright/test`'s `chromium`:
  - Targets: `https://agrohub-theta.vercel.app` at `/` → `landing`, `/lots` → `lots`, `/prices` → `prices`.
  - Desktop shots at 1440×900, `deviceScaleFactor: 2`. Phone shots (`landing-phone`, `lots-phone`) use `devices['iPhone 13']`.
  - Wait for `networkidle` plus 1500ms, then take a viewport-only screenshot.
  - Fail loudly if any response is not 200.
- [ ] **Step 2:** Run `bun run capture`. Expected: 5 PNGs, each over 50KB. Look at each one and recapture any that shows a loader or an empty state.
- [ ] **Step 3:** Optimise them: `bunx sharp-cli` is optional. Next/image serves them, so committing PNGs under 1.5MB each is fine. If a file is larger, downscale with `ffmpeg -i in.png -vf scale=2160:-1 out.png`.
- [ ] **Step 4:** Run `bun run build`. Expected: clean. Re-run the carousel e2e. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add AgroHub screenshots and capture script`.

---

### Task 9: Stack section

**Files:**
- Create: `components/stack/{StackGrid,StackIcon}.tsx`
- Test: `tests/unit/stack.test.tsx`

**Interfaces:**
- Consumes: `stack`, `filterStack` (Task 3), `HandNote` (Task 5).
- Produces:
  - `<StackGrid items: StackItem[]/>` (client)
  - `<StackIcon slug: string className?/>` (server-safe: renders the simple-icons `path` in `currentColor`; `'terminal'`/`'key'` are inline Lucide-style SVGs)
- Behaviour:
  - Tabs All/Frontend/Backend/Tools/Design as a `role="tablist"` with `aria-selected`.
  - Chips are `border border-line rounded-md px-3 py-1.5 text-[15px] text-ink-muted` with an icon.
  - `AnimatePresence` + `layout` handle filtering; hovering a chip runs `whileHover={{ rotate: [0,-4,4,0] }}`, which is disabled with reduced motion.
  - The title has a HandNote "( hover to play )".

- [ ] **Step 1: Write the failing tests**

```tsx
test('filtering to Tools shows n8n and hides React', async () => { render(<StackGrid items={stack} />)
  fireEvent.click(screen.getByRole('tab', { name: 'Tools' }))
  expect(await screen.findByText('n8n')).toBeInTheDocument()
  await waitFor(() => expect(screen.queryByText('React')).not.toBeInTheDocument()) })
test('every stack icon resolves', () => { for (const s of stack) expect(() => renderToString(<StackIcon slug={s.icon} />)).not.toThrow() })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Import the icons individually (`import { siNextdotjs } from 'simple-icons'`) through a slug→icon map, so the bundle only carries the icons used.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add stack grid`.

---

### Task 10: GitHub contribution grid

**Files:**
- Create: `lib/github.ts`, `components/github/{ContribGrid,ContribTooltip}.tsx`
- Test: `tests/unit/github.test.ts`

**Interfaces:**
- Produces:

```ts
type Day = { date: string; count: number; level: 0|1|2|3|4 }
type Calendar = { total: number; weeks: Day[][]; isSample: boolean }
parseGithubCalendar(json: unknown): Calendar          // GraphQL contributionCalendar → Calendar; throws on bad shape
sampleCalendar(seed: string, endDate: string): Calendar  // 53 weeks ending endDate (a Saturday), deterministic
fetchContributions(username: string, token: string | undefined, fetchImpl?: typeof fetch): Promise<Calendar>
  // no token / non-200 / parse error → sampleCalendar(username, SAMPLE_END) ; never throws
getContributions(): Promise<Calendar>                 // 'use cache'; cacheLife('days'); calls fetchContributions(site.githubUsername, process.env.GITHUB_TOKEN)
SAMPLE_END = '2026-11-07'
```

- GraphQL query: `query($login:String!){user(login:$login){contributionsCollection{contributionCalendar{totalContributions weeks{contributionDays{date contributionCount contributionLevel}}}}}}`. Map `contributionLevel` like this: `NONE`→0, `FIRST_QUARTILE`→1, `SECOND_QUARTILE`→2, `THIRD_QUARTILE`→3, `FOURTH_QUARTILE`→4.
- `<ContribGrid cal: Calendar/>` (server SVG):
  - Cell 11px, gap 3px, `rx=2`. Fills use `var(--contrib-0..4)`, defined in globals.css. Light: `--line #C9C5BD #9A968F #5E5B56 #21201D`; dark: `#2E2B27 #4A4640 #6F6A62 #A29E96 #EDEAE3`.
  - Month labels sit on top.
  - Footer: "{total} contributions in the last year" plus a Less→More legend. When `isSample`, append " · sample data" in `text-ink-faint`.
  - Each cell has a `<title>` and `data-date`/`data-count`; `ContribTooltip` (client) shows a styled tooltip on hover or focus.

- [ ] **Step 1: Write the failing tests**

```ts
test('parses GraphQL', () => { const c = parseGithubCalendar(fixture); expect(c.total).toBe(517); expect(c.weeks[0][0].level).toBe(0); expect(c.isSample).toBe(false) })
test('sample is deterministic and 53 weeks', () => { const a = sampleCalendar('x', SAMPLE_END), b = sampleCalendar('x', SAMPLE_END)
  expect(a).toEqual(b); expect(a.weeks).toHaveLength(53); expect(a.weeks.at(-1)!.at(-1)!.date).toBe(SAMPLE_END); expect(a.isSample).toBe(true) })
test('no token → sample, no fetch', async () => { const f = vi.fn(); expect((await fetchContributions('u', undefined, f)).isSample).toBe(true); expect(f).not.toHaveBeenCalled() })
test('API failure → sample, never throws', async () => {
  const f = vi.fn().mockResolvedValue(new Response('nope', { status: 502 }))
  expect((await fetchContributions('u', 't', f)).isSample).toBe(true) })
```

  Put a small hand-written fixture at `tests/unit/fixtures/github-calendar.json` (2 weeks, total 517).
- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. The sample PRNG is mulberry32 seeded from a string hash. Dates are computed with `new Date(endDate + 'T00:00:00Z')` arithmetic in UTC only.
- [ ] **Step 4:** Run unit tests. Then run `bun run build` with no `GITHUB_TOKEN`. Expected: PASS, and the build succeeds (Review Focus 5).
- [ ] **Step 5:** Commit `feat: add GitHub contribution grid with sample fallback`.

---

### Task 11: Blog (MDX)

**Files:**
- Modify: `next.config.ts`
- Create: `mdx-components.tsx`, `lib/posts.ts`, `lib/reading-time.ts`, `components/blog/{PostRow,Prose}.tsx`, `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`, `content/blog/{shipping-agrohub-escrow,n8n-chat-intake}.mdx`
- Test: `tests/unit/posts.test.ts`, `tests/e2e/blog.spec.ts`

**Interfaces:**
- Each post exports ESM metadata (no YAML frontmatter, so no extra remark plugin):

```mdx
export const meta = { title: '…', date: '2026-11-01', summary: '…', tags: ['agrohub'], draft: false }
```

- `lib/posts.ts`:

```ts
const PostMeta = z.object({ title: z.string().min(1), date: z.iso.date(), summary: z.string().min(1), tags: z.array(z.string()).default([]), draft: z.boolean().default(false) })
type Post = z.infer<typeof PostMeta> & { slug: string; readingMinutes: number }
listSlugs(dir?: string): string[]                     // fs.readdirSync(content/blog) *.mdx
parseMeta(slug: string, raw: unknown): PostMeta       // throws Error(`Invalid frontmatter in content/blog/${slug}.mdx: …`)
getAllPosts(opts?: { includeDrafts?: boolean }): Promise<Post[]>   // dynamic import(`@/content/blog/${slug}.mdx`), sorted date desc; drafts excluded unless includeDrafts or NODE_ENV==='development'
groupByYear(posts: Post[]): [year: string, posts: Post[]][]       // years desc
```

- `readingMinutes(source: string): number` uses `Math.max(1, Math.round(words / 220))` after stripping ESM export lines and code fences.
- `next.config.ts`:
  - `pageExtensions: ['ts','tsx','md','mdx']`
  - `createMDX({ options: { rehypePlugins: [['@shikijs/rehype', { themes: { light: 'github-light', dark: 'github-dark-dimmed' } }]] } })`
  - keep `cacheComponents`, `partialPrefetching` and the turbopack css rule
- Pages:
  - `/blog`: major hero (lead "Writing.", statement "Notes on building fullstack apps and automations."); RowList per year (label = `formatDate` "Nov 1", title, body = summary, aside = "{n} min"); side nav variant `index` with year anchors.
  - `/blog/[slug]`: `generateStaticParams` from `listSlugs()`; `export const dynamicParams = false`; minor hero (title, `MetaTable` with date, reading time and tags); `<Prose>` article; back link "← All writing".
  - Shiki dual themes switch through CSS on `[data-theme="dark"] .shiki span { color: var(--shiki-dark) }`.
- Seed two short real-sounding posts drawn from the repos (AgroHub's held-payment model; Rossyz's n8n chat intake with idempotent turn IDs). Mark each `// TODO(content): owner to edit`.

- [ ] **Step 1: Write the failing tests**

```ts
test('invalid frontmatter names the file', () => expect(() => parseMeta('bad', { title: '' })).toThrow('content/blog/bad.mdx'))
test('groups by year desc', () => expect(groupByYear([p('2025-01-01'), p('2026-03-01'), p('2026-01-01')]).map(([y, ps]) => [y, ps.length])).toEqual([['2026', 2], ['2025', 1]]))
test('reading time ignores code and exports', () => expect(readingMinutes('export const meta = {}\n' + 'word '.repeat(440) + '\n```\n' + 'x '.repeat(5000) + '\n```')).toBe(2))
test('listSlugs finds seeded posts', () => expect(listSlugs()).toEqual(expect.arrayContaining(['shipping-agrohub-escrow', 'n8n-chat-intake'])))
```

```ts
test('blog index lists posts and opens one', async ({ page }) => { await page.goto('/blog')
  await page.getByRole('link', { name: /AgroHub/i }).first().click(); await expect(page).toHaveURL(/\/blog\/shipping-agrohub-escrow$/)
  await expect(page.locator('article h1, h1')).toBeVisible() })
test('unknown post 404s', async ({ page }) => { const r = await page.goto('/blog/nope'); expect(r!.status()).toBe(404) })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run unit + e2e + build. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add MDX blog`.

---

### Task 12: Home page assembly

**Files:**
- Modify: `app/page.tsx`
- Test: `tests/e2e/home.spec.ts`

**Interfaces:**
- Consumes: everything above.
- Sections, in order:

| # | `id` / title | Content |
|---|---|---|
| 1 | hero | `PageHero` major + `HandNote` + `CtaGroup` + status lines |
| 2 | `works` (`hideNav`) | `WorkCarousel slides={homeSlides()}`, then `ArrowLink href="/playground"` "Pet projects & experiments" |
| 3 | `experience` / "Experience" | `RowList` (label = `start – end`, title = `title · company`, body = summary), then an "Education" sub-heading with a `RowList` |
| 4 | `stack` / "Stack" | `StackGrid` |
| 5 | `activity` / "GitHub activity" | `ContribGrid cal={await getContributions()}` |
| 6 | `writing` / "Writing" | latest 3 posts as `RowList`, plus `ArrowLink href="/blog"` "All writing" |
| 7 | `contact` / "Contact" | short major-style statement "Have a role in mind? Let's talk." + `CtaGroup` + plain email link |

- Side nav links: Works, Experience, Stack, Writing, Contact.
- Each section is wrapped in `ScrollBlur` (not the carousel itself).
- A footer line: "© 2026 Destine Jonathan" · "Playground" · "RSS".

- [ ] **Step 1: Write the failing test**

```ts
test('home sections render in order', async ({ page }) => { await page.goto('/')
  const ids = await page.$$eval('main section[id]', s => s.map(e => e.id))
  expect(ids).toEqual(['works', 'experience', 'stack', 'activity', 'writing', 'contact']) })
test('nav click scrolls and activates', async ({ page, isMobile }) => { test.skip(isMobile); await page.goto('/')
  await page.getByRole('link', { name: 'Stack' }).click(); await page.waitForTimeout(600)
  await expect(page.getByRole('link', { name: 'Stack' })).toHaveAttribute('aria-current', 'true') })
test('experience lists Welup first', async ({ page }) => { await page.goto('/')
  await expect(page.locator('#experience li').first()).toContainText('Welup Digital') })
test('pet projects link', async ({ page }) => { await page.goto('/'); await page.getByRole('link', { name: /Pet projects/ }).click(); await expect(page).toHaveURL(/\/playground$/) })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Remove the temporary test scaffolding from Tasks 2 and 4.
- [ ] **Step 4:** Run all e2e. Expected: PASS (the playground link test passes after Task 13, so leave it fixme'd until then).
- [ ] **Step 5:** Commit `feat: assemble home page`.

---

### Task 13: Case study, playground and 404

**Files:**
- Create: `app/work/[slug]/page.tsx`, `app/playground/page.tsx`, `app/not-found.tsx`
- Test: `tests/e2e/pages.spec.ts`

**Interfaces:**
- `/work/[slug]`:
  - `generateStaticParams` from `projects`; `dynamicParams = false`.
  - Side nav `detail` with `back={{href:'/', label:'← Destine Jonathan'}}`.
  - Minor hero: title = name, body = summary, then `MetaTable`:
    - Role
    - Stack (joined with " · ")
    - Year
    - Status ("In progress"/"Shipped")
    - Links ("Live ↗", "Code ↗")
  - `Timeline` if present.
  - Each image is wrapped in `ScrollBlur` inside a `bg-paper-raised rounded-2xl p-[clamp(12px,3vw,40px)]` well, rendered as `next/image` `sizes="(min-width: 768px) 900px, 100vw"`, with an optional caption below in `text-[13px] text-ink-faint`. Matches `refs/03-project-page.png`.
  - "Next project →" appears only when `getNextProject` isn't null; the closing `CtaGroup` always does.
- `/playground`:
  - Minor hero: title "Pet projects & experiments"; body "Smaller things I've built, alone or with friends. The big one is AgroHub."
  - Two `RowList`s, "Client & collaborations" and "Experiments" (label = role, title = name, body = summary, aside = `ArrowLink external` "Visit" when `url`).
  - Side nav `detail` with back link.
- `not-found.tsx`: minor hero "Nothing here." with links home and to writing.

- [ ] **Step 1: Write the failing test**

```ts
test('agrohub case study', async ({ page }) => { await page.goto('/work/agrohub')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('AgroHub')
  await expect(page.getByRole('link', { name: /Live/ })).toHaveAttribute('href', 'https://agrohub-theta.vercel.app')
  await expect(page.getByText('Next project')).toHaveCount(0)
  await expect(page.getByRole('link', { name: '← Destine Jonathan' })).toBeVisible() })
test('playground groups', async ({ page }) => { await page.goto('/playground')
  await expect(page.getByRole('heading', { name: 'Client & collaborations' })).toBeVisible()
  await expect(page.getByRole('link', { name: /Thymus/ }).or(page.getByText('Thymus Energy FZCO'))).toBeVisible() })
test('unknown work 404s', async ({ page }) => { expect((await page.goto('/work/nope'))!.status()).toBe(404) })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. Un-fixme the carousel click test (Task 7) and the playground link test (Task 12).
- [ ] **Step 4:** Run all e2e. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add case study, playground and 404 pages`.

---

### Task 14: Generated résumé PDF

**Files:**
- Create: `lib/resume/ResumeDocument.tsx`, `lib/resume/build.ts`, `app/resume.pdf/route.ts`
- Test: `tests/unit/resume.test.ts`

**Interfaces:**
- `buildResumePdf(): Promise<Uint8Array>` (`build.ts`): `renderToBuffer(<ResumeDocument …content/>)`, with no Next imports so Vitest can run it.
- `app/resume.pdf/route.ts`:
  - `GET` calls a module-level `async function cachedPdf() { 'use cache'; cacheLife('max'); return buildResumePdf() }`.
  - It returns `new Response(bytes, { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': 'attachment; filename="Destine-Jonathan-Resume.pdf"' } })`.
- Document:
  - One A4 page, using the built-in Helvetica (no font fetch).
  - Header: name, role, email · GitHub · LinkedIn · site URL.
  - Body sections: Summary (one paragraph from `site.hero` statements), Experience, Featured project (AgroHub + stack), Skills (stack names by category), Education, and a final line "More: destine-jonathan…/playground". Use `process.env.NEXT_PUBLIC_SITE_URL ?? 'https://destinejonathan.dev'`, marked `// TODO(content): real domain`.
  - Black ink on white, hairline rules.

- [ ] **Step 1: Write the failing test**

```ts
test('builds a one-page PDF with the name and no phone', async () => {
  const b = await buildResumePdf(); const s = Buffer.from(b).toString('latin1')
  expect(s.startsWith('%PDF')).toBe(true); expect(b.byteLength).toBeGreaterThan(5000)
  expect((s.match(/\/Type\s*\/Page[^s]/g) ?? []).length).toBe(1)
  expect(s).not.toMatch(/2347043970102/) }, 20000)
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement. If text in the PDF is compressed, the name assertion lives in e2e instead: `GET /resume.pdf` returns 200, `content-type: application/pdf`, and a `content-disposition` containing `attachment`. Add that e2e to `tests/e2e/pages.spec.ts`.
- [ ] **Step 4:** Run unit + e2e + build. Expected: PASS. Open the PDF once (convert page 1 to PNG with `pdftoppm` if available) and check the layout visually.
- [ ] **Step 5:** Commit `feat: generate résumé PDF from site content`.

---

### Task 15: SEO, OG images, sitemap, robots, RSS

**Files:**
- Create: `app/opengraph-image.tsx`, `app/work/[slug]/opengraph-image.tsx`, `app/blog/[slug]/opengraph-image.tsx`, `app/sitemap.ts`, `app/robots.ts`, `app/blog/rss.xml/route.ts`, `lib/site-url.ts`
- Modify: each page's `metadata`/`generateMetadata`
- Test: `tests/e2e/seo.spec.ts`

**Interfaces:**
- `siteUrl(): string` returns `process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3100'`. Use it for `metadataBase`, the sitemap, the RSS feed and the résumé.
- OG images are 1200×630 `ImageResponse`: paper background, wordmark at top left, title in large ink type, role line in muted text. Use the default font, since fetching fonts at build is brittle.
- The sitemap covers `/`, `/playground`, `/blog`, each `/work/*` and each `/blog/*`.
- `robots` allows all and links the sitemap.
- RSS 2.0 lists every non-draft post.

- [ ] **Step 1: Write the failing test**

```ts
test('sitemap lists routes', async ({ request }) => { const t = await (await request.get('/sitemap.xml')).text()
  for (const p of ['/playground', '/blog', '/work/agrohub', '/blog/shipping-agrohub-escrow']) expect(t).toContain(p) })
test('rss valid-ish', async ({ request }) => { const r = await request.get('/blog/rss.xml'); expect(r.headers()['content-type']).toContain('xml')
  expect(await r.text()).toContain('<item>') })
test('og image', async ({ request }) => { const r = await request.get('/opengraph-image'); expect(r.headers()['content-type']).toBe('image/png') })
test('titles', async ({ page }) => { await page.goto('/work/agrohub'); await expect(page).toHaveTitle('AgroHub — Destine Jonathan') })
```

- [ ] **Step 2:** Run. Expected: FAIL.
- [ ] **Step 3:** Implement.
- [ ] **Step 4:** Run. Expected: PASS.
- [ ] **Step 5:** Commit `feat: add metadata, OG images, sitemap, robots and RSS`.

---

### Task 16: Final verification

**Files:**
- Test: `tests/e2e/layout.spec.ts`, `tests/e2e/reduced-motion.spec.ts`

- [ ] **Step 1: Write the tests**

```ts
for (const path of ['/', '/work/agrohub', '/playground', '/blog', '/blog/shipping-agrohub-escrow'])
  test(`no horizontal scroll on ${path}`, async ({ page }) => { await page.goto(path)
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0) })
```

```ts
test.use({ reducedMotion: 'reduce' })
test('no blur under reduced motion', async ({ page }) => { await page.goto('/work/agrohub'); await page.mouse.wheel(0, 1200); await page.waitForTimeout(300)
  const blurred = await page.$$eval('main *', els => els.filter(e => /blur\(/.test(getComputedStyle(e).filter)).length); expect(blurred).toBe(0) })
```

- [ ] **Step 2:** Run `bun run test:e2e`. Expected: PASS on desktop and phone. Fix anything that fails in the component that owns it.
- [ ] **Step 3: Visual pass.**
  - Screenshot `/`, `/work/agrohub`, `/playground`, `/blog` and one post at 1440 and at iPhone 13, in light and dark, into the scratchpad.
  - Compare against `docs/superpowers/specs/refs/01–05` and fix spacing and type drift. The hero rhythm and the side nav position should match `01-hero.png`.
- [ ] **Step 4: Lighthouse.** With the server on :3100, run `bunx lighthouse http://localhost:3100/ --chrome-path=/opt/pw-browsers/chromium --chrome-flags="--headless --no-sandbox" --preset=desktop --output=json --quiet` and the same for `/work/agrohub`. Expected: each of performance, accessibility, best-practices and SEO is at least 0.95 (spec success criterion 6). If the Chromium path differs, find it with `ls /opt/pw-browsers`.
- [ ] **Step 5:** Run `bun run lint && bun run typecheck && bun run test && bun run build`. Expected: all clean.
- [ ] **Step 6:** Commit `test: add layout and reduced-motion checks; polish`, then push.
