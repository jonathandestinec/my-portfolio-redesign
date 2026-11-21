# Client proposals v2: agreement structure, options, invoices, discovery

- **Date:** 2026-11-20
- **Status:** Approved by the owner (answers below)
- **Builds on:** `2026-11-20-client-proposals-design.md`
- **Source:** course material (Module 10, packaging, pricing and client delivery, T19–T20)

## Owner decisions

| Question | Answer |
| --- | --- |
| Three options per proposal? | Yes, up to three tiers; the client picks one, then signs |
| Payment terms | Course defaults: 50% deposit before work, balance on acceptance due in 15 days, 1.5% a month on overdue amounts, work pauses after 10 working days late |
| Invoices | Yes. "How to pay" shows **both** a Paystack link and bank details |
| Discovery tab | Yes |

## 1. Proposal content (what changes)

| Area | v1 | v2 |
| --- | --- | --- |
| Part one | "What you need" | **"In your words"**: the client's own words from discovery, shown as a quote |
| Objectives | — | The measurable result both sides agree (e.g. "cut missed orders from ~20 a week to under 2") |
| Price | One milestone table | **Options** (1–3). Each: name, one-line summary, deliverables (title, description, **format**), timeline (milestones by **working day from deposit**), price; one can be marked recommended |
| Scope | In only | In (the chosen option's deliverables) **and out** (a list, required before sending) |
| Client responsibilities | One generic clause | A list per proposal: what they supply, by when |
| Acceptance | Generic revisions clause | Criteria per proposal: "how we agree it is finished" |
| Payment terms | Per-milestone invoices, 7 days | Deposit %, balance due days after acceptance, late fee % a month, stop-work after N working days late (defaults 50 / 15 / 1.5 / 10) |
| Closing | Sign form | **"How to say yes"**: 1. pick an option, 2. sign, 3. pay the deposit; work starts within N working days of it arriving |

Old proposals are upgraded on read: their scope and milestones become a single option. Snapshots that were already sent keep rendering.

## 2. Agreement template (in this order)

1. Overview: who, what, when, how much (filled for the chosen option)
2. Objectives
3. Scope: in and out
4. Deliverables, each with its format
5. Timeline: working days from the deposit, with milestones
6. Client responsibilities
7. Payment schedule: deposit, balance, due dates, late terms, stop-work
8. Acceptance criteria and revisions
9. Change orders: written request, written quote (price and days), approval before work starts
10. General terms: ownership, accounts and access, confidentiality, warranty, liability, ending, law, e-signature

Then the signatures (rendered by the page and the PDF). Each option has its own filled contract in the snapshot. The fingerprint covers all options, and the signature records which option was chosen.

## 3. Invoices

- **Numbering:** `2026-001`, `2026-002`… per calendar year, allocated atomically.
- **Deposit invoice:** created when the client signs. Due date stated as a date (default 3 days after issue). The signed page then shows "Pay the deposit".
- **Balance invoice:** created when the owner marks the work **accepted** in the desk. Due date is 15 days after (stated as a date).
- **The 9 lines:** your business name, phone and email; invoice number; date issued; due date (a date, never "Net 15"); client business name; what it is for (option name and what was delivered); amounts (deposit paid, balance due, total); how to pay (Paystack button **and** bank details); terms (late fee in one line).
- **Where:** a private page `/i/<number>-<random>` (noindex) plus a PDF. The owner's desk lists each proposal's invoices with paid, unpaid and overdue status.
- **Paystack:** "Pay now" starts a Paystack checkout for the exact amount (NGN). A payment is marked paid only after the server verifies it with Paystack (callback and signed webhook). The owner can also mark a bank transfer as paid by hand. Needs `PAYSTACK_SECRET_KEY` in Vercel, and the webhook URL set in the Paystack dashboard.
- **Bank details and business phone:** stored in a desk **Settings** page (database, not the public repo).
- **Emails to the owner:** invoice paid.

## 4. Discovery

A desk tab for each surveyed business: name, contact, date, and the five questions with notes:

1. Walk me through how an order reaches you now. *(listen for the manual step)*
2. What part of that goes wrong most often? *(their exact words)*
3. How often does that happen, and what does it cost you when it does? *(the value number)*
4. Who else would have to agree before you tried something new? *(the decision-maker)*
5. If I showed you something next week, would you look at it? *(the soft yes)*

Plus a follow-up date and status. **Start a proposal** from a discovery entry pre-fills the client, "In your words" (answer 2), objectives (from answer 3) and the signer (the decision-maker from answer 4).

## 5. Out of the app

The service menu, delivery checklist, payment-route test and case study are course submissions. They are drafted with the owner, not built into the site.

## Testing

- Unit: option totals and deposit maths, upgrading v1 content, per-option contract filling, invoice numbering format, due-date and working-day maths, the Paystack signature check.
- Integration (dev branch): sign with a chosen option creates the deposit invoice; marking accepted creates the balance invoice; numbering is sequential with no duplicates under concurrency.
- E2E: a client picks option 2, signs, sees "Pay the deposit", and the invoice page shows all 9 lines; discovery to proposal pre-fill.
