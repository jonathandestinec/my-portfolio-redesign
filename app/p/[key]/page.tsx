import { Suspense } from "react";
import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { after, connection } from "next/server";
import { Notice, Unavailable } from "@/components/proposals/Notice";
import { ProposalView } from "@/components/proposals/ProposalView";
import { SignForm } from "@/components/proposals/SignForm";
import { UnlockForm } from "@/components/proposals/UnlockForm";
import { proposalsConfigured } from "@/lib/proposals/db";
import { notifyOwner } from "@/lib/proposals/email";
import { getSignatures, recordView } from "@/lib/proposals/repo";
import { clientIp, ipHash } from "@/lib/proposals/security";
import { formatDate } from "@/lib/proposals/snapshot";
import { formatMoney } from "@/lib/proposals/money";
import { invoiceKey, invoiceState, listInvoices, type InvoiceRow } from "@/lib/proposals/invoices";
import { clientAccess, clientApi, clientUrl, signedBy } from "@/lib/proposals/service";

// A private page per client: rendered per request, never cached or indexed.
export const instant = false;

export const metadata: Metadata = {
  title: { absolute: "Proposal" },
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

async function ClientProposalPage({ params }: Props) {
  await connection(); // always per request, even when no cookie or header is read
  if (!proposalsConfigured()) return <Unavailable />;
  const { key } = await params;
  const store = await cookies();
  const access = await clientAccess(key, (n) => store.get(n)?.value);

  if (access.kind === "missing" || access.kind === "unavailable") return <Unavailable />;
  const api = clientApi(access.row);
  if (access.kind === "locked") {
    return (
      <Notice title="This proposal is protected.">
        <p className="m-0 muted">Enter the passcode you were sent with the link.</p>
        <UnlockForm endpoint={`${api}/unlock`} />
      </Notice>
    );
  }

  const { row, snapshot, status, contentSha256 } = access;
  const h = await headers();
  const firstView = row.status === "sent";
  after(async () => {
    await recordView(row, ipHash(clientIp(h)), h.get("user-agent"));
    if (firstView) {
      await notifyOwner({
        subject: `Opened: proposal for ${snapshot.client.name}`,
        text: `${snapshot.client.name} opened their proposal (version ${snapshot.version}).\n\n${clientUrl(row)}`,
      });
    }
  });

  const [sigs, invoices] = await Promise.all([getSignatures(row.id, row.version), status === "signed" ? listInvoices(row.id) : []]);
  return (
    <ProposalView
      snapshot={snapshot}
      logoUrl={snapshot.client.logoKey ? `${api}/logo` : null}
      pdfUrl={`${api}/pdf`}
      signatures={signedBy(sigs, (s) => `${api}/signature/${s.role}?v=${s.version}`)}
      signing={
        status === "signed" ? null : (
          <SignForm
            endpoint={`${api}/sign`}
            version={row.version}
            contentSha256={contentSha256}
            defaultName={snapshot.client.contactName}
            defaultEmail={snapshot.client.contactEmail}
            optionLabels={Object.fromEntries(snapshot.options.map((o) => [o.id, `${o.name} · ${formatMoney(o.priceMinor, snapshot.currency)}`]))}
          />
        )
      }
      afterSigning={<AfterSigning invoices={invoices} />}
      banner={
        status === "signed" ? (
          <div className="pp-banner" role="status">
            <div className="col">
              Signed by {sigs.find((s) => s.role === "client")?.name}.{" "}
              <a href={`${api}/pdf`} className="text-link">
                Download the signed PDF
              </a>
            </div>
          </div>
        ) : row.version > 1 ? (
          <div className="pp-banner" role="status">
            <div className="col">This proposal was updated on {formatDate(snapshot.issuedAt)}. You’re reading the latest version.</div>
          </div>
        ) : null
      }
    />
  );
}

/** Next steps once signed: the deposit (and later the balance) invoice. */
function AfterSigning({ invoices }: { invoices: InvoiceRow[] }) {
  const open = invoices.filter((i) => i.status !== "void");
  if (!open.length) return null;
  return (
    <div className="cards">
      {open.map((inv) => {
        const state = invoiceState(inv);
        const label = inv.kind === "deposit" ? "Deposit" : "Balance";
        return (
          <div key={inv.id} className="card">
            <div className="card__body">
              {state === "paid" ? (
                <p className="m-0">
                  <span className="medium">{label} received.</span> <span className="muted">Thank you. Invoice {inv.number}.</span>
                </p>
              ) : (
                <>
                  <p className="m-0">
                    <span className="medium">
                      Next: pay the {label.toLowerCase()} of {formatMoney(inv.amountMinor, inv.currency)}
                    </span>
                    <br />
                    <span className={state === "overdue" ? "pp-error" : "muted"}>
                      Invoice {inv.number}, due {formatDate(inv.dueAt)}
                      {state === "overdue" ? " (overdue)" : ""}
                    </span>
                  </p>
                  <div className="actions">
                    <a href={`/i/${invoiceKey(inv)}`} className="button">
                      View invoice and pay
                    </a>
                  </div>
                </>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Request-time content renders inside a boundary so the (static) metadata never waits on it.
export default function Page(props: Props) {
  return (
    <Suspense fallback={null}>
      <ClientProposalPage {...props} />
    </Suspense>
  );
}
