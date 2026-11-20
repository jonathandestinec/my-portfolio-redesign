import { connection } from "next/server";
import { Suspense } from "react";
import { DeskHeader, DeskTabs, NotSetUp, SignInFirst } from "@/components/proposals/DeskChrome";
import { SettingsForm } from "@/components/proposals/SettingsForm";
import { proposalsConfigured } from "@/lib/proposals/db";
import { getBusiness } from "@/lib/proposals/invoices";
import { currentOwner } from "@/lib/proposals/owner";
import { paystackConfigured } from "@/lib/proposals/paystack";

export const instant = false;

async function Settings() {
  await connection();
  if (!proposalsConfigured()) return <NotSetUp />;
  if (!(await currentOwner())) return <SignInFirst />;
  return (
    <div className="desk-wrap">
      <DeskHeader crumbs={[{ label: "Settings" }]} />
      <DeskTabs current="/desk/settings" />
      <SettingsForm initial={await getBusiness()} paystack={paystackConfigured()} />
    </div>
  );
}

export default function Page() {
  return (
    <Suspense fallback={null}>
      <Settings />
    </Suspense>
  );
}
