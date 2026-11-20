import { cookies } from "next/headers";
import { json } from "@/lib/proposals/http";
import { checkPasscode, clientIp, rateLimit, unlockCookieName, unlockValue } from "@/lib/proposals/security";
import { clientAccess } from "@/lib/proposals/service";

export async function POST(req: Request, ctx: RouteContext<"/api/p/[key]/unlock">) {
  const { key } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`unlock:${ip ?? "?"}:${key}`, 8, 15 * 60 * 1000)) return json({ error: "Too many attempts. Please wait a few minutes." }, 429);

  const store = await cookies();
  const a = await clientAccess(key, (n) => store.get(n)?.value);
  if (a.kind === "ok") return json({ ok: true });
  if (a.kind !== "locked" || !a.row.passcodeHash) return json({ error: "This proposal is no longer available." }, 404);

  const body = (await req.json().catch(() => null)) as { passcode?: unknown } | null;
  const passcode = typeof body?.passcode === "string" ? body.passcode.trim() : "";
  if (!passcode || !(await checkPasscode(passcode, a.row.passcodeHash))) return json({ error: "That passcode isn’t right." }, 401);

  store.set(unlockCookieName(a.row.id), unlockValue(a.row.id, a.row.passcodeHash), {
    httpOnly: true,
    secure: new URL(req.url).protocol === "https:",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  return json({ ok: true });
}
