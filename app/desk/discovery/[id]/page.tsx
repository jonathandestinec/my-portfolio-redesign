import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeskHeader, NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { DiscoveryEditor } from "@/components/proposals/DiscoveryEditor";
import { proposalsConfigured } from "@/lib/proposals/db";
import { getDiscovery } from "@/lib/proposals/discovery";
import { currentOwner } from "@/lib/proposals/owner";

export const instant = false;

async function EditDiscovery({ params }: PageProps<"/desk/discovery/[id]">) {
  await connection();
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  const { id } = await params;
  const d = await getDiscovery(id);
  if (!d) notFound();
  return (
    <div className="desk-wrap desk-wrap--wide">
      <DeskHeader crumbs={[{ href: "/desk/discovery", label: "Discovery" }, { label: d.business || "Unnamed business" }]} />
      <DiscoveryEditor id={id} initialBusiness={d.business} initial={d.notes} proposalUrl={d.proposalId ? `/desk/${d.proposalId}` : null} />
    </div>
  );
}

export default function Page(props: PageProps<"/desk/discovery/[id]">) {
  return (
    <Suspense fallback={null}>
      <EditDiscovery {...props} />
    </Suspense>
  );
}
