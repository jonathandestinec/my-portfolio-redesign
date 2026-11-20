import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { DeskHeader, DeskTabs, NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { proposalsConfigured } from "@/lib/proposals/db";
import { listDiscoveries } from "@/lib/proposals/discovery";
import { currentOwner } from "@/lib/proposals/owner";
import { createDiscoveryAction } from "../actions";

export const instant = false;

const FOLLOW = { "": "Not asked", yes: "Soft yes", maybe: "Maybe", no: "No" } as const;

async function DiscoveryList() {
  await connection();
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  const items = await listDiscoveries();
  return (
    <div className="desk-wrap">
      <DeskHeader
        crumbs={[{ label: "Discovery" }]}
        actions={
          <form action={createDiscoveryAction}>
            <button type="submit" className="button">
              New conversation
            </button>
          </form>
        }
      />
      <DeskTabs current="/desk/discovery" />
      {items.length ? (
        <ul className="list">
          {items.map((d) => (
            <li key={d.id}>
              <Link href={`/desk/discovery/${d.id}`} className="list__row list__row-link desk-row">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="medium truncate">{d.business || "Unnamed business"}</span>
                  <span className="muted text-[14px] truncate">
                    {[d.notes.contactName, d.notes.valueNumber, d.notes.followUpOn ? `follow up ${d.notes.followUpOn}` : ""].filter(Boolean).join(" · ") || "No notes yet"}
                  </span>
                </span>
                <span className="desk-status">{d.proposalId ? "Proposal" : FOLLOW[d.notes.followUp]}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card">
          <div className="card__body">
            <p className="m-0 medium">No conversations yet</p>
            <p className="m-0 muted">
              Five questions, three businesses, under an hour each. Write their answers here, then start a proposal from the ones where questions 3 and 4 say it’s worth it.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <DiscoveryList />
    </Suspense>
  );
}
