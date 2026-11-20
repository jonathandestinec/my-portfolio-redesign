import { fileResponse, json, notFound } from "@/lib/proposals/http";
import { currentOwner } from "@/lib/proposals/owner";
import { previewSnapshot } from "@/lib/proposals/preview";
import { getProposal } from "@/lib/proposals/repo";
import { pdfFilename, renderPdf } from "@/lib/proposals/service";

/** The PDF of what the client would see now (preview), for the owner. */
export async function GET(_req: Request, ctx: RouteContext<"/api/desk/[id]/pdf">) {
  if (!(await currentOwner())) return json({ error: "Not allowed" }, 403);
  const { id } = await ctx.params;
  const row = await getProposal(id);
  if (!row) return notFound();
  const { snapshot, contentSha256 } = await previewSnapshot(row);
  const body = await renderPdf(row, snapshot, contentSha256);
  return fileResponse({ body, contentType: "application/pdf" }, `inline; filename="${pdfFilename(snapshot, false)}"`);
}
