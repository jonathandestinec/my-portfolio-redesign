# Client proposals: design spec

- **Date:** 2026-11-20
- **Status:** Approved; version 1 built
- **Lives in:** the portfolio app (`destinejc.vercel.app`), managed from the private admin area
- **Stack:** Next.js 16 (existing app) · Neon Postgres + Drizzle · GitHub sign-in reused from Studio · Vercel Blob · Resend · `@react-pdf/renderer` (already used for the résumé)

## 1. What it is

A private web page made for one client, at a link only they get. It shows both brands side by side, explains what will be built, proves it with the most relevant past work, lays out scope, milestones and price, and ends with a contract the client reads and signs on the page. Both sides get a signed PDF.

In the industry this is called a **client proposal** (or proposal page). Sales teams call the bigger version a **digital sales room**. Qwilr, PandaDoc, Proposify and Better Proposals are general-purpose tools for it. This one is different because it is built on the portfolio's own content: projects are picked, not re-typed, and they link to live case studies and working apps.

### Success criteria

1. Creating a proposal for a new client takes under 10 minutes, starting from a template.
2. The client needs nothing but the link: no account, works on a phone, signs in under a minute.
3. A signed proposal can't change afterwards, and the signature record would stand up as evidence: who signed, when, from where, and exactly what text they agreed to.
4. Nobody can find a proposal without its link. Proposals never appear in search, the sitemap, or the public repo.
5. The page looks and feels like the portfolio, with the same type, spacing, cards and motion.

## 2. Key decision: where proposal data lives

The portfolio repo is **public**, and Keystatic saves content as commits to it. Client names, prices and contracts must not be public. So:

- **Proposals, signatures and views go in a database** (Neon Postgres), not in the repo.
- **Reusable, non-private pieces stay in the repo** and are edited in the existing Keystatic panel:
  - **Contract templates** (your standard terms, with placeholders like `{{client}}`, `{{total}}`)
  - **Your proposal defaults** (logo, signature line, payment terms, default validity)
  - **Project tags** for matching relevant work
- **Proposals are managed in a small custom admin** next to Keystatic, behind the same hidden gate, with its own GitHub sign-in that only allows your account. Keystatic can only edit files in the repo, so it can't manage database records.

*Alternative:* make the repo private and keep everything in Keystatic. That's simpler to build, but signatures and view tracking still need a database, and a public repo is a nice thing for a developer to show. Recommended: database.

## 3. Flows

### 3.1 You create and send a proposal

1. Open the admin (private address → **Proposals** → **New**).
2. Fill in:
   - **Client:** name, logo upload, contact name and email.
   - **The brief:** a short "what you need" paragraph, plus **tags** for the kind of work (e.g. payments, marketplace, events, automation, dashboard).
3. **Relevant work** is suggested automatically from the tags: your projects ranked by how many tags they share. Tick the ones to show and drag them into order. Optionally add a one-line "why this is relevant" under each.
4. **Scope:** a list of deliverables, each with an optional description.
5. **Milestones:** name, what's delivered, amount, due date or duration. The total is calculated. Choose the currency (₦ or $).
6. **Contract:** pick a template. Placeholders are filled in, and you can edit the text for this client.
7. **Validity:** expiry date, defaulting to 14 days.
8. **Preview** exactly what the client will see, then **Send**. Sending applies your signature and generates the private link. You can copy the link or email it from the admin.

Proposal states: `draft` → `sent` → `viewed` → `signed` · or `expired` · or `withdrawn`. You can edit a proposal until it's signed. Editing a sent proposal makes a new version, and a client who already opened the old one sees "This proposal was updated".

### 3.2 The client opens the link

Sections, top to bottom, in the portfolio's design language:

1. **Header:** your wordmark × their logo, "Proposal for {Client}", date and "valid until".
2. **Intro:** a short personal note from you.
3. **What you need:** the brief, in your words.
4. **Relevant work:** project cards (cover image, name, one line on why it's relevant), each linking to its case study and live app. These reuse the existing project content, so they stay current.
5. **Scope:** deliverables in a bordered list.
6. **Milestones & price:** a table of milestones and amounts, then the total.
7. **Contract:** the full terms, readable on the page. A **Download PDF** link lets them read it offline.
8. **Sign:** see 3.3.
9. **Footer:** questions? Book a call or email, using your existing links.

It works without JavaScript for reading. Signing needs JavaScript.

### 3.3 Signing

1. The client fills in: full name, email, role or title (optional), and a signature. They can **type it** (rendered in a handwriting font) or **draw it** (canvas, works with touch).
2. A checkbox: "I have read and agree to the terms above."
3. **Sign** records:
   - the signer's details and the signature image;
   - the exact time (UTC);
   - their IP address and browser;
   - a **SHA-256 fingerprint of the exact contract text and price table** they saw, together with the proposal version.
4. The proposal is **frozen**: its content is stored as an immutable snapshot, and the page then shows the signed version only.
5. A **signed PDF** is generated: the full proposal, both signatures, and an **audit page** with every recorded detail and the fingerprint. It's stored privately, and emailed to the client and to you through Resend.
6. The page shows "Signed by {name} on {date}" with a download link.

Electronic signatures are generally recognised in Nigeria (Evidence Act 2011, s. 93) and most other places. Have a lawyer review the contract *template* once. The audit trail above is what makes a signature defensible.

### 3.4 Afterwards (you)

- The proposal list shows each proposal's status, when it was last viewed, view count and signed date.
- You can withdraw, duplicate (for a similar client) or extend the expiry.

## 4. Privacy and security

- **Links:** `/p/<client-slug>-<random>`, where the random part is 16+ characters from a cryptographically secure source. They aren't guessable, and the client slug is only there for readability.
- **Not indexed:** proposal pages send `noindex, nofollow`, are excluded from the sitemap and robots.txt, and are never cached publicly.
- **Expired or withdrawn links** show a polite "This proposal is no longer available. Get in touch" page with no client data.
- **Optional passcode** per proposal, for sensitive deals.
- **Uploads:** client logos, signature images and signed PDFs go in **private** Vercel Blob storage and are served only through proposal routes.
- **Admin:** behind the existing hidden gate, plus GitHub sign-in that only allows your GitHub account ID. Every admin action is checked on the server.
- **Rate limits:** signing and the passcode check are rate-limited per IP.

## 5. Data model (Postgres, Drizzle)

- **proposals**: id, slug, token, status, version, client_name, client_logo_key, contact_name, contact_email, intro, brief, tags[], project_slugs[] (ordered), project_notes (json), scope (json), milestones (json), currency, total_minor (integer, kobo or cents), contract_template_id, contract_body (text), passcode_hash (nullable), expires_at, sent_at, created_at, updated_at
- **proposal_versions**: proposal_id, version, snapshot (json of everything the client sees), created_at
- **proposal_views**: proposal_id, version, viewed_at, ip_hash, user_agent
- **signatures**: proposal_id, version, role (`client` or `provider`), name, email, title, method (`typed` or `drawn`), signature_key, ip, user_agent, signed_at, content_sha256, pdf_key

Money is stored as integer minor units (as in AgroHub) and never as floats.

## 6. Matching relevant work

- Add a **Tags** field to projects in Keystatic, from a fixed list you control, e.g. `payments`, `marketplace`, `events`, `automation`, `dashboard`, `mobile-first`, `auth`, `realtime`, `content-site`.
- **Suggested projects** are those sharing the most tags with the proposal, with ties broken by your project order. You always confirm the final set and its order.
- Client-work items from /works can be picked as well as the big case studies.

## 7. Version 1 vs later

**Version 1 (about a week):**
- the admin list, create, edit and preview;
- the proposal page and private links with expiry;
- contract templates in Keystatic;
- typed and drawn signatures with the audit record;
- the signed PDF and emails;
- view tracking, statuses, withdraw and duplicate.

**Later:**
- **Pay the first milestone on signing:** a Paystack checkout, with the amount going to your account.
- **Optional add-ons** the client can toggle, with the price updating live.
- **Comments:** the client asks a question on a section; you get an email.
- **Multiple signers** on the client's side.
- **Richer analytics:** time spent per section.
- **Your own domain**, e.g. `proposals.yourdomain.com`.
- **Product version:** multi-user, so other freelancers and agencies can use it.

## 8. Testing

- **Unit:** placeholder filling; total and currency maths; tag-matching order; content fingerprint stability (same content gives the same hash); token generation; expiry rules.
- **Integration (test database branch):** create → send → view → sign; signing a stale version is refused; signed proposals can't be edited; a withdrawn proposal shows no client data.
- **End to end (Playwright):** the client signs on a phone, typed and drawn; the PDF downloads; the admin requires sign-in; proposal pages send `noindex` and aren't in the sitemap; a wrong or expired link shows the generic page.
- **Visual:** proposal pages checked against the portfolio's design at phone and desktop sizes.

## 9. Open questions for the owner

1. **Database or private repo?** (Section 2.) The spec assumes a database on Neon. You already use Neon for Huddle.
2. **Currency:** naira only, dollars only, or chosen per proposal? The spec assumes per proposal.
3. **Contract template:** do you have standard terms already, or should I draft a starting template (scope, payment schedule, revisions, IP ownership, confidentiality, termination) for a lawyer to review?
4. **Countersigning:** do you sign when you send (the spec assumes this) or after the client signs?
5. **Default validity:** 14 days?
6. **Do clients ever need a passcode**, or are private links enough?
7. **Emails:** sent from your address via Resend (needs a verified domain), or a plain notification sender?
