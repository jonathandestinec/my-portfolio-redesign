import "server-only";
import { cookies } from "next/headers";
import { clientAccess, type ClientAccess } from "./service";

export const PRIVATE_HEADERS = {
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow, noarchive",
} as const;

export const json = (body: unknown, status = 200) =>
  Response.json(body, { status, headers: PRIVATE_HEADERS });

export const notFound = () => new Response("Not found", { status: 404, headers: PRIVATE_HEADERS });

/** Access check for client API routes: anything but full access is a plain 404. */
export async function accessFor(key: string): Promise<Extract<ClientAccess, { kind: "ok" }> | null> {
  const store = await cookies();
  const a = await clientAccess(key, (n) => store.get(n)?.value);
  return a.kind === "ok" ? a : null;
}

export function fileResponse(file: { body: Buffer; contentType: string }, disposition?: string) {
  return new Response(new Uint8Array(file.body), {
    headers: {
      ...PRIVATE_HEADERS,
      "Content-Type": file.contentType,
      "X-Content-Type-Options": "nosniff",
      ...(disposition ? { "Content-Disposition": disposition } : {}),
    },
  });
}
