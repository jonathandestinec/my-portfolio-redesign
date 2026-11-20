import { randomBytes } from "node:crypto";
import { json } from "@/lib/proposals/http";
import { currentOwner } from "@/lib/proposals/owner";
import { getProposal } from "@/lib/proposals/repo";
import { MAX_LOGO_BYTES, saveFile, sniffImage } from "@/lib/proposals/storage";

/** Uploads a client logo (PNG, JPEG or WebP, up to 2 MB). Returns its storage key; the editor saves it with the proposal. */
export async function POST(req: Request, ctx: RouteContext<"/api/desk/[id]/logo">) {
  if (!(await currentOwner())) return json({ error: "Not allowed" }, 403);
  const { id } = await ctx.params;
  if (!(await getProposal(id))) return json({ error: "Not found" }, 404);
  const form = await req.formData().catch(() => null);
  const file = form?.get("file");
  if (!(file instanceof File)) return json({ error: "Choose an image." }, 400);
  if (file.size > MAX_LOGO_BYTES) return json({ error: "Logos must be 2 MB or smaller." }, 400);
  const body = Buffer.from(await file.arrayBuffer());
  const kind = sniffImage(body);
  if (!kind) return json({ error: "Use a PNG, JPEG or WebP image." }, 400);
  const key = await saveFile(`proposals/${id}/logo-${randomBytes(6).toString("hex")}.${kind.ext}`, body, kind.type);
  return json({ key });
}
