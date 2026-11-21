import { Suspense } from "react";
import { connection } from "next/server";
import Link from "next/link";
import { DeskHeader, DeskTabs, NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { proposalsConfigured } from "@/lib/proposals/db";
import { formatMoney } from "@/lib/proposals/money";
import { currentOwner } from "@/lib/proposals/owner";
import { listProposals } from "@/lib/proposals/repo";
import { formatDate } from "@/lib/proposals/snapshot";
import { STATUS_LABEL } from "@/lib/proposals/status";
import { createAction } from "./actions";

export const instant = false;

const ago = (d: Date) => {
  const mins = Math.round((Date.now() - d.getTime()) / 60000);
  if (mins < 60) return `${Math.max(mins, 1)} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 48) return `${hours} h ago`;
  return formatDate(d);
};

async function DeskHome() {
  await connection(); // always per request, even when no cookie or header is read
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  const items = await listProposals();

  return (
    <div className="desk-wrap">
      <DeskHeader
        crumbs={[{ label: "Proposals" }]}
        actions={
          <form action={createAction}>
            <button type="submit" className="button">
              New proposal
            </button>
          </form>
        }
      />
      <DeskTabs current="/desk" />
      {items.length ? (
        <ul className="list">
          {items.map((p) => (
            <li key={p.id}>
              <Link href={`/desk/${p.id}`} className="list__row list__row-link desk-row">
                <span className="flex min-w-0 flex-col gap-0.5">
                  <span className="medium truncate">{p.clientName}</span>
                  <span className="muted text-[14px]">
                    {p.options > 1 ? `${p.options} options, recommended ` : ""}
                    {formatMoney(p.totalMinor, p.currency)}
                    {p.version ? ` · v${p.version}` : ""}
                    {p.views ? ` · ${p.views} view${p.views === 1 ? "" : "s"}, last ${ago(p.lastViewedAt!)}` : ""}
                    {p.signedAt ? ` · signed ${formatDate(p.signedAt)}` : ""}
                    {!p.signedAt && p.expiresAt && p.status !== "draft" ? ` · until ${formatDate(p.expiresAt)}` : ""}
                  </span>
                </span>
                <span className={`desk-status desk-status--${p.status}`}>{STATUS_LABEL[p.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : (
        <div className="card">
          <div className="card__body">
            <p className="m-0 medium">No proposals yet</p>
            <p className="m-0 muted">Start one from your default intro and contract. Nothing is visible to anyone until you send it.</p>
          </div>
        </div>
      )}
    </div>
  );
}

// Request-time content renders inside a boundary so the (static) metadata never waits on it.
export default function Page() {
  return (
    <Suspense fallback={null}>
      <DeskHome />
    </Suspense>
  );
}
