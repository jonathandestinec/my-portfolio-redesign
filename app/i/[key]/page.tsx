import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { BankDetails, InvoiceView } from "@/components/proposals/InvoiceView";
import { Notice } from "@/components/proposals/Notice";
import { proposalsConfigured } from "@/lib/proposals/db";
import { getInvoiceByToken, invoiceKey, invoiceState } from "@/lib/proposals/invoices";
import { paystackConfigured } from "@/lib/proposals/paystack";
import { tokenFromKey } from "@/lib/proposals/tokens";

export const instant = false;

export const metadata: Metadata = {
  title: { absolute: "Invoice" },
  robots: { index: false, follow: false, nocache: true },
  referrer: "no-referrer",
};

type Props = { params: Promise<{ key: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> };

function Missing() {
  return (
    <Notice title="This invoice isn’t available.">
      <p className="m-0 muted">Check the link, or get in touch and I’ll send it again.</p>
    </Notice>
  );
}

async function InvoicePage({ params, searchParams }: Props) {
  await connection();
  if (!proposalsConfigured()) return <Missing />;
  const { key } = await params;
  const sp = await searchParams;
  const token = tokenFromKey(key);
  const inv = token ? await getInvoiceByToken(token) : null;
  if (!inv || invoiceKey(inv) !== key || inv.status === "void") return <Missing />;
  const state = invoiceState(inv);
  const api = `/api/i/${invoiceKey(inv)}`;
  const payError = typeof sp.error === "string" ? sp.error : null;

  const pay =
    state === "paid" ? (
      <p className="m-0">
        <span className="medium">Paid. Thank you.</span>
      </p>
    ) : (
      <div className="flex flex-col gap-4">
        {paystackConfigured() && inv.currency === "NGN" ? (
          <form method="post" action={`${api}/pay`} className="actions">
            <button type="submit" className="button">
              Pay by card or transfer
            </button>
            <span className="cta__note">Secure checkout by Paystack.</span>
          </form>
        ) : null}
        <BankDetails d={inv.details} number={inv.number} />
      </div>
    );

  const notice =
    sp.paid === "1" && state === "paid" ? (
      <div className="pp-banner" role="status">
        <div className="col">Payment received. Thank you.</div>
      </div>
    ) : payError ? (
      <div className="pp-banner" role="alert">
        <div className="col pp-error">{payError === "unverified" ? "That payment couldn’t be confirmed yet. If you were charged, it will show here shortly." : "The payment couldn’t start. Try again, or pay by bank transfer."}</div>
      </div>
    ) : null;

  return (
    <InvoiceView
      inv={{ ...inv, state, details: inv.details }}
      pay={pay}
      pdfUrl={`${api}/pdf`}
      notice={notice}
    />
  );
}

export default function Page(props: Props) {
  return (
    <Suspense fallback={null}>
      <InvoicePage {...props} />
    </Suspense>
  );
}
