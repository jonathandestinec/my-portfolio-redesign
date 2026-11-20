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

  const sigs = await getSignatures(row.id, row.version);
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
          />
        )
      }
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

// Request-time content renders inside a boundary so the (static) metadata never waits on it.
export default function Page(props: Props) {
  return (
    <Suspense fallback={null}>
      <ClientProposalPage {...props} />
    </Suspense>
  );
}
