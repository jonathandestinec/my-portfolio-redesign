import type { ReactNode } from "react";
import { Wordmark } from "@/components/layout/Wordmark";
import type { InvoiceState } from "@/lib/proposals/invoices";
import type { InvoiceDetails } from "@/lib/proposals/invoice-types";
import { formatMoney } from "@/lib/proposals/money";
import { formatDate } from "@/lib/proposals/snapshot";

export type InvoiceViewData = {
  number: string;
  kind: "deposit" | "balance";
  issuedAt: Date;
  dueAt: Date;
  paidAt: Date | null;
  state: InvoiceState;
  amountMinor: number;
  details: InvoiceDetails;
};

/** The nine lines of a real invoice, in the portfolio's design. */
export function InvoiceView({ inv, pay, pdfUrl, notice }: { inv: InvoiceViewData; pay: ReactNode; pdfUrl: string; notice?: ReactNode }) {
  const d = inv.details;
  const money = (m: number) => formatMoney(m, d.currency);
  const stateLabel = { paid: "Paid", unpaid: "Unpaid", overdue: "Overdue", void: "Cancelled" }[inv.state];

  return (
    <main id="content" className="pp">
      {notice}
      <div className="col pp-head">
        <div className="pp-brands">
          <Wordmark />
        </div>
        <div className="lead">
          <h1>
            Invoice <span className="hl">{inv.number}</span>
          </h1>
        </div>
        <p className="pp-meta">
          <span className={`desk-status desk-status--${inv.state === "paid" ? "signed" : inv.state === "overdue" ? "viewed" : "draft"}`}>{stateLabel}</span>
          {inv.paidAt ? <span>Paid {formatDate(inv.paidAt)}</span> : null}
        </p>
      </div>

      <section className="section section--tight col" aria-label="Invoice details">
        <dl className="facts">
          <div className="facts__row">
            <dt>From</dt>
            <dd>
              <span className="medium">{d.from.businessName}</span>
              <br />
              <span className="muted">{[d.from.phone, d.from.email].filter(Boolean).join(" · ")}</span>
              {d.from.address ? (
                <>
                  <br />
                  <span className="muted">{d.from.address}</span>
                </>
              ) : null}
            </dd>
          </div>
          <div className="facts__row">
            <dt>Invoice no.</dt>
            <dd>{inv.number}</dd>
          </div>
          <div className="facts__row">
            <dt>Issued</dt>
            <dd>{formatDate(inv.issuedAt)}</dd>
          </div>
          <div className="facts__row">
            <dt>Due</dt>
            <dd className="medium">{formatDate(inv.dueAt)}</dd>
          </div>
          <div className="facts__row">
            <dt>Billed to</dt>
            <dd>
              <span className="medium">{d.client.name}</span>
              {d.client.contactName ? <span className="muted"> · {d.client.contactName}</span> : null}
            </dd>
          </div>
          <div className="facts__row">
            <dt>For</dt>
            <dd>
              <span className="medium">{d.forTitle}</span>
              {d.forLines.map((l) => (
                <span key={l} className="muted block">
                  {l}
                </span>
              ))}
            </dd>
          </div>
        </dl>
      </section>

      <section className="section section--tight col" aria-labelledby="amounts-title">
        <h2 id="amounts-title" className="section__title">
          Amount
        </h2>
        <ul className="list pp-price">
          <li className="list__row">
            <span>Project total</span>
            <span className="pp-amount">{money(d.amounts.totalMinor)}</span>
          </li>
          {d.amounts.depositPaidMinor > 0 ? (
            <li className="list__row">
              <span>Deposit paid</span>
              <span className="pp-amount">−{money(d.amounts.depositPaidMinor)}</span>
            </li>
          ) : null}
          <li className="list__row pp-total">
            <span className="medium">{inv.kind === "deposit" ? "Deposit due now" : "Balance due"}</span>
            <span className="pp-amount medium">{money(inv.amountMinor)}</span>
          </li>
          {d.amounts.balanceAfterMinor > 0 ? (
            <li className="list__row">
              <span className="muted">Balance after this, on acceptance</span>
              <span className="pp-amount muted">{money(d.amounts.balanceAfterMinor)}</span>
            </li>
          ) : null}
        </ul>
      </section>

      <section className="section section--tight col" aria-labelledby="pay-title">
        <h2 id="pay-title" className="section__title">
          How to pay
        </h2>
        {pay}
        <p className="m-0 muted text-[14px]">{d.terms}</p>
        <p className="m-0">
          <a href={pdfUrl} className="text-link">
            Download as PDF
          </a>
        </p>
      </section>
    </main>
  );
}

export function BankDetails({ d, number }: { d: InvoiceDetails; number: string }) {
  if (!d.from.bankName || !d.from.accountNumber) return null;
  return (
    <dl className="facts">
      <div className="facts__row">
        <dt>Bank</dt>
        <dd>{d.from.bankName}</dd>
      </div>
      <div className="facts__row">
        <dt>Account name</dt>
        <dd>{d.from.accountName}</dd>
      </div>
      <div className="facts__row">
        <dt>Account no.</dt>
        <dd className="medium">{d.from.accountNumber}</dd>
      </div>
      <div className="facts__row">
        <dt>Reference</dt>
        <dd>{number}</dd>
      </div>
    </dl>
  );
}
