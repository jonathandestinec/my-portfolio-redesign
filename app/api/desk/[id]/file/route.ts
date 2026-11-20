import { fileResponse, json, notFound } from "@/lib/proposals/http";
import { currentOwner } from "@/lib/proposals/owner";
import { readFile } from "@/lib/proposals/storage";

/** Any stored file of one proposal (logo, signature, signed PDF), for the owner only. */
export async function GET(req: Request, ctx: RouteContext<"/api/desk/[id]/file">) {
  if (!(await currentOwner())) return json({ error: "Not allowed" }, 403);
  const { id } = await ctx.params;
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!key.startsWith(`proposals/${id}/`) || key.includes("..")) return notFound();
  const file = await readFile(key).catch(() => null);
  if (!file) return notFound();
  const name = key.split("/").pop()!;
  return fileResponse(file, file.contentType === "application/pdf" ? `attachment; filename="${name}"` : undefined);
}
