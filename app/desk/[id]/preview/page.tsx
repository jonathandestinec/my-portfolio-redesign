import { Suspense } from "react";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { ProposalView } from "@/components/proposals/ProposalView";
import { proposalsConfigured } from "@/lib/proposals/db";
import { currentOwner } from "@/lib/proposals/owner";
import { previewSnapshot } from "@/lib/proposals/preview";
import { getProposal, getSignatures } from "@/lib/proposals/repo";
import { signedBy } from "@/lib/proposals/service";

export const instant = false;

/** Exactly what the client would see if you sent now. Views here are not recorded. */
async function PreviewProposal({ params }: PageProps<"/desk/[id]/preview">) {
  await connection(); // always per request, even when no cookie or header is read
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  const { id } = await params;
  const row = await getProposal(id);
  if (!row) notFound();
  const { snapshot, isNext } = await previewSnapshot(row);
  const file = (key: string) => `/api/desk/${id}/file?key=${encodeURIComponent(key)}`;
  const sigs = isNext ? [] : await getSignatures(id, snapshot.version);

  return (
    <ProposalView
      snapshot={snapshot}
      logoUrl={snapshot.client.logoKey ? file(snapshot.client.logoKey) : null}
      pdfUrl={`/api/desk/${id}/pdf`}
      signatures={signedBy(sigs, (s) => file(s.signatureKey))}
      banner={
        <div className="pp-banner" role="status">
          <div className="col">
            Preview{isNext ? ` of version ${snapshot.version}, not sent yet` : `, version ${snapshot.version} as sent`}.{" "}
            <a href={`/desk/${id}`} className="text-link">
              Back to editing
            </a>
          </div>
        </div>
      }
      signing={
        <div className="card">
          <div className="card__body">
            <p className="m-0 muted">The client signs here: name, email, an optional title, and a typed or drawn signature.</p>
          </div>
        </div>
      }
    />
  );
}

// Request-time content renders inside a boundary so the (static) metadata never waits on it.
export default function Page(props: PageProps<"/desk/[id]/preview">) {
  return (
    <Suspense fallback={null}>
      <PreviewProposal {...props} />
    </Suspense>
  );
}
