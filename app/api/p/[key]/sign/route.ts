import { after } from "next/server";
import { accessFor, json } from "@/lib/proposals/http";
import { clientIp, rateLimit } from "@/lib/proposals/security";
import { completeClientSignature, decodeSignature } from "@/lib/proposals/service";

const str = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

export async function POST(req: Request, ctx: RouteContext<"/api/p/[key]/sign">) {
  const { key } = await ctx.params;
  const ip = clientIp(req.headers);
  if (!rateLimit(`sign:${ip ?? "?"}`, 10, 10 * 60 * 1000)) return json({ error: "Too many attempts. Please wait a few minutes." }, 429);

  const a = await accessFor(key);
  if (!a) return json({ error: "This proposal is no longer available." }, 404);
  if (a.status === "signed") return json({ error: "This proposal has already been signed." }, 409);

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!body) return json({ error: "Something went wrong. Please try again." }, 400);
  const name = str(body.name, 120);
  const email = str(body.email, 200);
  const title = str(body.title, 120) || null;
  const method = body.method === "drawn" ? "drawn" : "typed";
  const png = decodeSignature(body.image);
  if (body.agree !== true) return json({ error: "Please confirm you agree to the terms." }, 400);
  if (name.length < 2) return json({ error: "Please enter your full name." }, 400);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return json({ error: "Please enter a valid email." }, 400);
  if (!png) return json({ error: "Please add your signature." }, 400);
  const optionId = typeof body.optionId === "string" ? body.optionId : "";
  if (!a.snapshot.options.some((o) => o.id === optionId)) return json({ error: "Please pick an option first." }, 400);
  if (body.version !== a.row.version || body.contentSha256 !== a.contentSha256) {
    return json({ error: "This proposal was updated while you were reading. Please reload the page and review it again." }, 409);
  }

  const result = await completeClientSignature({
    row: a.row,
    version: a.row.version,
    contentSha256: a.contentSha256,
    optionId,
    name,
    email,
    title,
    method,
    png,
    ip,
    userAgent: req.headers.get("user-agent")?.slice(0, 400) ?? null,
  });
  if (!result.ok) return json({ error: "This proposal can no longer be signed. Please reload the page." }, 409);
  after(() => result.email);
  return json({ ok: true });
}
