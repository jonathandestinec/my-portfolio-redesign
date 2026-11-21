import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { DeskHeader, NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { ProposalEditor } from "@/components/proposals/ProposalEditor";
import { loadContracts, proposalDefaults, workCatalog } from "@/lib/proposals/content";
import { proposalsConfigured } from "@/lib/proposals/db";
import { currentOwner } from "@/lib/proposals/owner";
import { getBusiness, hasBankDetails, invoiceState, listInvoices, workingDaysLate } from "@/lib/proposals/invoices";
import { invoiceUrl } from "@/lib/proposals/payments";
import { getProposal, getSignatures, getVersion, getViews, hasUnsentChanges } from "@/lib/proposals/repo";
import { clientUrl } from "@/lib/proposals/service";
import { effectiveStatus } from "@/lib/proposals/status";
import { WORK_TAGS } from "@/lib/proposals/tags";

export const instant = false;

async function EditProposal({ params }: PageProps<"/desk/[id]">) {
  await connection(); // always per request, even when no cookie or header is read
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  const { id } = await params;
  const row = await getProposal(id);
  if (!row) notFound();

  const [sigs, views, unsent, invoices, business, current] = await Promise.all([
    getSignatures(id),
    getViews(id, 10),
    hasUnsentChanges(row),
    listInvoices(id),
    getBusiness(),
    row.version ? getVersion(id, row.version) : null,
  ]);
  const optionName = (v: number, optionId: string | null) =>
    v === row.version && current && optionId ? (current.snapshot.options.find((o) => o.id === optionId)?.name ?? null) : null;
  const file = (key: string) => `/api/desk/${id}/file?key=${encodeURIComponent(key)}`;
  const status = effectiveStatus(row);

  return (
    <div className="desk-wrap desk-wrap--wide">
      <DeskHeader crumbs={[{ href: "/desk", label: "Proposals" }, { label: row.content.clientName || "Untitled client" }]} />
      <ProposalEditor
        id={id}
        initial={row.content}
        status={status}
        version={row.version}
        unsent={unsent}
        hasPasscode={Boolean(row.passcodeHash)}
        expiresAt={row.expiresAt?.toISOString() ?? null}
        acceptedAt={row.acceptedAt?.toISOString() ?? null}
        discoveryUrl={row.content.discoveryId ? `/desk/discovery/${row.content.discoveryId}` : null}
        businessReady={hasBankDetails(business)}
        invoices={invoices.map((inv) => ({
          id: inv.id,
          number: inv.number,
          kind: inv.kind,
          amountMinor: inv.amountMinor,
          currency: inv.currency,
          state: invoiceState(inv),
          dueAt: inv.dueAt.toISOString(),
          paidAt: inv.paidAt?.toISOString() ?? null,
          paidVia: inv.paidVia,
          daysLate: workingDaysLate(inv),
          url: invoiceUrl(inv),
        }))}
        link={row.version > 0 ? clientUrl(row) : null}
        logoUrl={row.content.clientLogoKey ? file(row.content.clientLogoKey) : null}
        catalog={workCatalog().map(({ key, name, summary, tags }) => ({ key, name, summary, tags }))}
        contracts={loadContracts()}
        tags={WORK_TAGS.map((t) => ({ value: t.value, label: t.label }))}
        providerName={proposalDefaults.providerName}
        signatures={sigs.map((s) => ({
          id: s.id,
          role: s.role,
          version: s.version,
          name: s.name,
          email: s.email,
          signedAt: s.signedAt.toISOString(),
          ip: s.ip,
          contentSha256: s.contentSha256,
          imageUrl: file(s.signatureKey),
          pdfUrl: s.pdfKey ? file(s.pdfKey) : null,
          optionName: s.role === "client" ? optionName(s.version, s.optionId) : null,
        }))}
        views={views.map((v) => ({ at: v.viewedAt.toISOString(), version: v.version, userAgent: v.userAgent }))}
      />
    </div>
  );
}

// Request-time content renders inside a boundary so the (static) metadata never waits on it.
export default function Page(props: PageProps<"/desk/[id]">) {
  return (
    <Suspense fallback={null}>
      <EditProposal {...props} />
    </Suspense>
  );
}
