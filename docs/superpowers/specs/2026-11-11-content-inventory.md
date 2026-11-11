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
| **(confirm start)** – Present | Intern · Welup Digital | Ongoing internship. **(confirm role title and one-line summary)** |
| **(confirm start)** – Present | AI Training · GIZ | Ongoing AI training programme. **(confirm title and one-line summary)** |
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

## Featured projects (carousel, in this order)

| # | Project | Repo | What it is | Stack | Live URL |
|---|---|---|---|---|---|
| 1 | **AgroHub** (in progress) | `agrohub` | Phone-first platform where Nigerian farmer cooperatives sell members' harvests to bulk buyers. Buyers pay upfront; the money is held until delivery is confirmed, then split automatically to the cooperative and each farmer. Roles: farmer, officer, buyer, admin, board. i18n (English first; Pidgin, Hausa, Yoruba, Igbo planned). | Next.js, Prisma + Postgres (Neon), better-auth (2FA), next-intl, Paystack, S3 storage, Resend, Docker Compose, Vitest + Playwright | **(need URL)** |
| 2 | **Rossyz (TailorFlow)** | `tailorflow-nextjs`, `tailorflow-n8n` | Customer site for a bespoke fashion atelier plus a private business desk. An AI chat intake runs on n8n workflows; staff manage commission slots, orders, production stages and customer updates. | Next.js, n8n | **(need URL)** |
| 3 | **RefillRx** | `refillrx` | Community pharmacy refill service in Benin City: recurring medicine plans, reminders 3 days before refill, pharmacist chat, pickup status. | Next.js, Supabase (Postgres, Auth, Realtime, RLS), Paystack, Web Push, Resend, Vercel Cron | **(need URL)** |
| 4 | **FASCO Store** | `ecommerce-store` | Figma design turned into a working storefront: catalogue, cart, auth flows, Paystack checkout with verification. | Next.js, Supabase, TanStack Query, Zustand, Paystack | **(need URL)** |
| 5 | **Chatt** | `super-basic-chat-app(-front-end)` | Realtime chat app. | Next.js, Socket.io, Node/Express, MongoDB, JWT, SWR | super-basic-chat-app.vercel.app |
| 6 | **AnimeVault** | `animevault-development` | Personal anime library tracker. | Next.js, AniList GraphQL API | **(need URL)** |

## Collaborations and client work

Shown below the carousel as a `RowList` ("Also built"). Each row gets a role tag.

| Project | Role | Notes | Live URL |
|---|---|---|---|
| Chip Anna Putt | Built the whole thing (fullstack) | Golf training-kit brand: shop, lessons, members area. Supabase, Zustand, Resend. | **(need URL)** |
| Mofnet Enterprises | Built the whole thing | Automotive and real estate company site. Next.js, Framer Motion. | **(need URL)** |
| Saje Food Court | Built the whole thing | Restaurant site. | saje-food-court.vercel.app |
| Arinze Zikora portfolio | Built the whole thing | Portfolio for a web designer. | **(need URL)** |
| BAM Hire | Collaborated, fullstack | Staffing agency site. | bamhire.com |
| Bubbles Bay Auto Spa | Collaborated, fullstack | Car detailing site. | **(need URL)** |
| Thymus Energy FZCO | Collaborated, frontend | Corporate site for a petroleum trading company (trading, logistics, finance, risk pages). | **(need URL)** |
| A3 Fine Jewelry | Collaborated, frontend | Jewelry storefront: shop, categories, wishlist, checkout. | **(need URL)** |
| Stephen's Cosmetics | Frontend (from the résumé) | Cart with Zustand; Next.js image optimisation. | **(need URL)** |

## Older or learning projects (not shown)

Horizon Banking, Neko Hub, Socio, Huddle (only a landing page so far), the Positivus landing page, basic-postgres-crud, the GitHub profile viewer, plus tutorials and todo apps.

## Images

None of the repos contain project screenshots. This cloud session also can't reach `*.vercel.app`; the network blocks it.

**Plan:** once the live URLs are known, capture screenshots with Playwright at 1440×900 and 2× scale. That needs either the hosts allowed in this environment's network settings, or the owner running the capture script locally (the plan will include `scripts/capture-screenshots.ts`). Until then, each project uses a generated paper-style cover showing its name.
