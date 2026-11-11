# Content Inventory

- **Date:** 2026-11-11
- **Companion to:** `2026-11-11-portfolio-redesign-design.md`

This file replaces the placeholder content described in the spec. It was gathered from the owner's message, résumé PDF and GitHub repositories. Items marked **(confirm)** need the owner's answer.

## Identity (`content/site.ts`)

| Field | Value |
|---|---|
| Wordmark | `destine` / `jonathan` (two stacked lowercase lines) |
| Display name | Destine Jonathan |
| Role line | Fullstack Developer (résumé says "Frontend Developer"; site leads with fullstack — **confirm**) |
| Email | jonathandestinec@gmail.com |
| Calendar | https://cal.com/destine-jonathan-cvcewa/15min |
| GitHub | jonathandestinec |
| LinkedIn | linkedin.com/in/jonathandestinec (found in old portfolio repo — **confirm**) |
| X | **(confirm handle)** |
| Résumé | the supplied PDF → `/public/resume.pdf`. It contains a phone number — **confirm** it should be public. |

## Experience (`content/experience.ts`) — from résumé

| Years | Role · Company | Summary |
|---|---|---|
| Aug 2024 – Present | Front-End Developer · Nexorra Studio (remote) | Client web apps in React/Next.js/TypeScript; UI performance work; Zustand/Redux state and Socket.io realtime. |
| 2025 | Frontend Developer · Caretrax (remote) | UI components for a health and care web app; API integration with the team. |
| 2024 – 2025 | Frontend Developer · JoeNadiv Concepts | Responsive business web app; SEO and page-load improvements. |
| 05/2024 | Frontend development course · Aptech Computer Education, Abuja | Education row. |
| 01/2023 | Polymer and Textiles Engineering · Nnamdi Azikiwe University, Awka | Education row. |

## Stack (`content/stack.ts`) — from owner

- **Frontend:** Next.js, React, Astro, Tailwind CSS, TanStack Query (and TanStack libraries), Axios
- **Backend:** Node.js, Express, Bun, MongoDB, PostgreSQL, Prisma, Drizzle, OAuth, Clerk, JWT
- **Tools:** n8n, Docker, CLI, Git, GitHub, Vercel
- **Design:** Figma
- Also on the résumé but not in the owner's list: TypeScript, Zustand, Redux, Socket.io, Auth0. **(confirm: add these?)**

## Projects — proposed featured carousel (in order)

Every repo below was checked for README/product docs, dependencies and routes.

| # | Project | Repo | What it is | Stack evidence | Live URL |
|---|---|---|---|---|---|
| 1 | **AgroHub** (in progress) | `agrohub` (public) | Phone-first platform where Nigerian farmer cooperatives sell members' harvests to bulk buyers. Escrowed Paystack payments split automatically to the cooperative and each farmer; roles for farmer, officer, buyer, admin, board; i18n (EN, later Pidgin/Hausa/Yoruba/Igbo). | Next.js, Prisma + Postgres (Neon), better-auth with 2FA, next-intl, Paystack, S3 storage, Resend, Docker Compose, Vitest + Playwright | **(confirm)** |
| 2 | *(reserved: a private project, pending owner approval to describe it publicly)* | — | — | — | — |
| 3 | **RefillRx** | `refillrx` (public) | Community pharmacy refill service: recurring medicine plans, reminders 3 days before refill, pharmacist chat, pickup status. | Next.js, Supabase (Postgres, Auth, Realtime, RLS), Paystack, Web Push, Resend, Vercel Cron | **(confirm)** |
| 4 | **FASCO Store** | `ecommerce-store` (public) | Figma design turned into a working storefront: catalogue, cart, auth flows, Paystack checkout with verification. | Next.js, Supabase, TanStack Query, Zustand, Paystack | **(confirm)** |
| 5 | **Chatt (SB Chat)** | `super-basic-chat-app(-front-end)` | Realtime chat (on the résumé). | Next.js, Socket.io, Node/Express, MongoDB, JWT, SWR | super-basic-chat-app.vercel.app |
| 6 | **AnimeVault** | `animevault-development` (public) | Personal anime library tracker. | Next.js, AniList GraphQL API | **(confirm)** |

## Collaborations and client work (candidates)

These come from other owners' repos or client sites. **Your role on each is unknown — please confirm it.**

| Project | Repo | Notes |
|---|---|---|
| Thymus Energy FZCO | `Codebox124/Thymux-Energy-` | Corporate site for a petroleum trading company (multi-page: trading, logistics, finance, risk). |
| BAM Hire | `Codebox124/BamHire`, `bam-hire` | Staffing agency site; live at bamhire.com. Also listed in the old portfolio. |
| A3 Fine Jewelry | `OlaiwonAbdullahi/a3-fine-jewelry` | Jewelry storefront: shop, categories, wishlist, checkout. |
| Bubbles Bay Auto Spa | `bubbles-bay` | Car detailing site; co-committed with Codebox124. |
| Chip Anna Putt | `chipannaputt0` | Golf training-kit brand: shop, lessons, members area. Supabase, Zustand, Resend. |
| Saje Food Court | `saje-food-court` | Restaurant site; live at saje-food-court.vercel.app. |
| Arinze Zikora portfolio | `ziko-portfolio` | Designer's portfolio built for a client. |
| Stephen's Cosmetics | (on résumé; repo not found) | Cart with Zustand, image optimisation. |

## Older or learning projects (not featured)

Horizon Banking (Appwrite, Sentry, Chart.js), Neko Hub and Socio (Auth0, Prisma), Huddle (only a landing page so far), Positivus landing page, basic-postgres-crud, GitHub profile viewer, plus tutorials and todo apps. Repos that are empty or forks are excluded.

## Images

None of the repos contain usable project screenshots. **Plan:** capture screenshots of live sites with Playwright where a URL exists. Otherwise, run the app locally from its repo where that's feasible, or use designed placeholder covers until the owner supplies images.
