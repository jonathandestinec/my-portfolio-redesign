import { accessFor, fileResponse, notFound } from "@/lib/proposals/http";
import { readFile } from "@/lib/proposals/storage";

export async function GET(_req: Request, ctx: RouteContext<"/api/p/[key]/logo">) {
  const { key } = await ctx.params;
  const a = await accessFor(key);
  const logoKey = a?.snapshot.client.logoKey;
  if (!logoKey) return notFound();
  const file = await readFile(logoKey);
  return file ? fileResponse(file) : notFound();
}
