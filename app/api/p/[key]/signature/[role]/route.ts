import { accessFor, fileResponse, notFound } from "@/lib/proposals/http";
import { getSignatures } from "@/lib/proposals/repo";
import { readFile } from "@/lib/proposals/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/p/[key]/signature/[role]">) {
  const { key, role } = await ctx.params;
  const a = await accessFor(key);
  if (!a || (role !== "client" && role !== "provider")) return notFound();
  const sig = (await getSignatures(a.row.id, a.row.version)).find((s) => s.role === role);
  const file = sig ? await readFile(sig.signatureKey) : null;
  return file ? fileResponse(file) : notFound();
}
