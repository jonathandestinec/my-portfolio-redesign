import { accessFor, fileResponse, notFound } from "@/lib/proposals/http";
import { getSignatures } from "@/lib/proposals/repo";
import { pdfFilename, renderPdf } from "@/lib/proposals/service";
import { readFile } from "@/lib/proposals/storage";

/** The signed PDF once signed (stored, never regenerated); before that, a fresh copy to read offline. */
export async function GET(_req: Request, ctx: RouteContext<"/api/p/[key]/pdf">) {
  const { key } = await ctx.params;
  const a = await accessFor(key);
  if (!a) return notFound();
  const signed = a.status === "signed";
  const disposition = `attachment; filename="${pdfFilename(a.snapshot, signed)}"`;
  if (signed) {
    const sig = (await getSignatures(a.row.id, a.row.version)).find((s) => s.role === "client");
    const file = sig?.pdfKey ? await readFile(sig.pdfKey) : null;
    if (file) return fileResponse(file, disposition);
  }
  const body = await renderPdf(a.row, a.snapshot, a.contentSha256);
  return fileResponse({ body, contentType: "application/pdf" }, disposition);
}
