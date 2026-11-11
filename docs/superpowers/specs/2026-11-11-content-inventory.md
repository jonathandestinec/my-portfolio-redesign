# Content Inventory

- **Date:** 2026-11-11
- **Companion to:** `2026-11-11-portfolio-redesign-design.md`

This is the real content for the site, replacing the placeholders described in the spec. It was gathered from the owner's answers, the résumé PDF and the owner's GitHub repositories (public and private). The owner approved describing private projects publicly. Items marked **(confirm)** are still open.

## Identity (`content/site.ts`)

| Field | Value |
|---|---|
| Wordmark | `destine` / `jonathan` (two stacked lowercase lines) |
| Display name | Destine Jonathan |
| Role line | FullStack Developer & Automation Engineer |
| Email | jonathandestinec@gmail.com |
| Calendar | https://cal.com/destine-jonathan-cvcewa/15min |
| GitHub | jonathandestinec |
| LinkedIn | linkedin.com/in/jonathandestinec (from the old portfolio repo; the owner hasn't objected) |
| X | destine0_ |
| Résumé | Generated from site data (see spec §6, "Résumé PDF"). The old PDF is outdated and is not published. No phone number. |

## Experience (`content/experience.ts`)

| Years | Role · Company | Summary |
|---|---|---|
| Aug 2026 – Present | Software Development Intern · Welup Digital | Ongoing software development internship. |
| Aug 2026 – Present | AI & Automations Engineering · GIZ | Ongoing AI and automation engineering programme. |
| Aug 2024 – Present | Front-End Developer · Nexorra Studio (remote) | Client web apps in React/Next.js/TypeScript; UI performance work; Zustand/Redux state and Socket.io realtime. |
| 2025 | Frontend Developer · Caretrax (remote) | UI components for a health and care web app; API integration with the team. |
| 2024 – 2025 | Frontend Developer · JoeNadiv Concepts | Responsive business web app; SEO and page-load improvements. |

Education (shown as rows below experience, and on the résumé):

| Date | Course · Institution |
|---|---|
| 05/2024 | Frontend development course · Aptech Computer Education, Abuja |
| 01/2023 | Polymer and Textiles Engineering · Nnamdi Azikiwe University, Awka |

## Stack (`content/stack.ts`)

- **Frontend:** Next.js, React, TypeScript, Astro, Tailwind CSS, TanStack Query (and TanStack libraries), Axios, Zustand, Redux
- **Backend:** Node.js, Express, Bun, MongoDB, PostgreSQL, Prisma, Drizzle, Socket.io, OAuth, Clerk, JWT, Auth0
- **Tools / automation:** n8n, Docker, CLI, Git, GitHub, Vercel
- **Design:** Figma

TypeScript, Zustand, Redux, Socket.io and Auth0 come from the résumé and the repos. They stay in unless the owner removes them.

## Featured project (owner decision: AgroHub only)

AgroHub is the only major project and the only one featured on the home page. The Works carousel shows **AgroHub screens**: one slide per screen, all linking to `/work/agrohub`. Everything else lives on `/playground`.

| Project | Repo | What it is | Stack | Live URL |
|---|---|---|---|---|
| **AgroHub** (in progress) | `agrohub` | Phone-first platform where Nigerian farmer cooperatives sell members' harvests to bulk buyers. Buyers pay upfront; the money is held until delivery is confirmed, then split automatically to the cooperative and each farmer. Roles: farmer, officer, buyer, admin, board. i18n (English first; Pidgin, Hausa, Yoruba, Igbo planned). | Next.js, Prisma + Postgres (Neon), better-auth (2FA), next-intl, Paystack, S3 storage, Resend, Docker Compose, Vitest + Playwright | https://agrohub-theta.vercel.app |

Carousel slides (captured from the live site):

1. Landing — "Sell together. Get paid on delivery." (`/`)
2. Browse lots (public catalogue)
3. Price board (weekly crop prices)
4. Farmer, officer and buyer dashboards — **need a demo login or the owner's screenshots** (behind sign-in). Until then the carousel uses the public screens plus phone-width captures of them (the product is phone-first).

## Playground (`/playground`)

### Client & collaborations

| Project | Role | Notes | Live URL |
|---|---|---|---|
| Chip Anna Putt | Built end-to-end (fullstack) | Golf training-kit brand: shop, lessons, members area. Supabase, Zustand, Resend. | https://chipannaputt0.vercel.app |
| Saje Food Court | Built end-to-end | Restaurant site. | https://saje-food-court.vercel.app |
| BAM Hire | Collaborated · fullstack | Staffing agency site. | https://www.bamhire.com |
| Bubbles Bay Auto Spa | Collaborated · fullstack | Car detailing studio, Malete, Kwara. | https://bubbles-bay-bay.vercel.app |
| Thymus Energy FZCO | Collaborated · frontend | Corporate site for a petroleum trading company (trading, logistics, finance, risk pages). | https://www.thymus-energy.com |
| A3 Fine Jewelry | Collaborated · frontend | Jewelry storefront: shop, categories, wishlist, checkout. | — |

### Experiments

| Project | Notes | Stack | Live URL |
|---|---|---|---|
| Rossyz (TailorFlow) | Bespoke fashion atelier site + private desk; AI chat intake on n8n. | Next.js, n8n | https://tailorflow-theta.vercel.app |
| RefillRx | Pharmacy refill reminders, pharmacist chat, pickup status. | Next.js, Supabase, Paystack, Web Push, Resend | https://refillrx.vercel.app |
| FASCO Store | Figma design turned into a working storefront with Paystack checkout. | Next.js, Supabase, TanStack Query, Zustand | https://ecommerce-store-nine-xi.vercel.app |
| AnimeVault | Anime library tracker on the AniList API. | Next.js, AniList GraphQL | https://animevault-development-zeta.vercel.app |
| Chatt | Realtime chat. | Next.js, Socket.io, Express, MongoDB, JWT | https://super-basic-chat-app.vercel.app |

## Older or learning projects (not shown)

Mofnet Enterprises (not built yet), Arinze Zikora portfolio (excluded at owner's request), Horizon Banking, Neko Hub, Socio, Huddle (only a landing page so far), the Positivus landing page, basic-postgres-crud, the GitHub profile viewer, plus tutorials and todo apps.

## Live-site cross-check (2026-11-11)

Every URL loads (HTTP 200) and was visited with Playwright at 1440×900. Each site matches its description above.

| Site | Matches? | Notes for the portfolio |
|---|---|---|
| AgroHub | Yes | Strong hero ("Sell together. Get paid on delivery."). Good cover. |
| Rossyz | Yes | Bespoke clothing, Benin City; editorial serif hero. Good cover. |
| RefillRx | Yes | Pharmacy refill for Mani, Benin City; illustrated dark hero. Good cover. |
| FASCO | Yes | Storefront in ₦ with brand strip. **The live site still shows "Lorem ipsum" filler text** in Deals and New Arrivals — worth fixing before recruiters click through. |
| AnimeVault | Yes | The public page is only the "Connect AniList account" gate. Weak cover: needs a signed-in screenshot from the owner, or a designed cover. |
| Chatt | Yes | The public page is only the login form. Weak cover: needs a signed-in chat screenshot, or a designed cover. |
| Chip Anna Putt | Yes | Golf hero, shop/lessons/donate/videos. Good cover. |
| Bubbles Bay | Yes | Malete, Kwara; dark automotive hero. Good cover. |
| Thymus Energy | Yes | DMCC Dubai petroleum trading. Good cover. |
| Saje Food Court | Yes | The hero is mostly dark at first paint (intro animation); capture after a delay. |
| BAM Hire | Yes | Staffing site with press/insights cards. Good cover. |

## Images

Only AgroHub needs screenshots in v1 (its carousel slides and case-study images). Playground rows are text-only; no images.


Screenshots are captured from the live URLs above by `scripts/capture-screenshots.ts` (Playwright, 1440×900 at 2× scale, after the network goes idle plus a short delay) into `public/work/<slug>/`. Project pages also get one or two below-the-fold captures. AnimeVault and Chatt use a designed paper-style cover until the owner supplies signed-in screenshots.
