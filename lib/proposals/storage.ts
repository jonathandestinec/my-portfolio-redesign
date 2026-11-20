import "server-only";
import fs from "node:fs/promises";
import path from "node:path";
import { get, put } from "@vercel/blob";

/**
 * Private file storage for client logos, signature images and signed PDFs.
 * Uses the private Vercel Blob store when BLOB_READ_WRITE_TOKEN is set; otherwise
 * (local development, end-to-end tests) a git-ignored folder on disk.
 * Files are only ever served through proposal routes, never by a public URL.
 */

const LOCAL_DIR = path.join(process.cwd(), ".data", "blob");
const blobConfigured = () => Boolean(process.env.BLOB_READ_WRITE_TOKEN);

function safeKey(key: string): string {
  if (!/^[A-Za-z0-9/_.-]+$/.test(key) || key.includes("..")) throw new Error("Bad storage key");
  return key;
}

export async function saveFile(key: string, body: Buffer, contentType: string): Promise<string> {
  safeKey(key);
  if (blobConfigured()) {
    const res = await put(key, body, { access: "private", contentType, addRandomSuffix: false, allowOverwrite: true });
    return res.pathname;
  }
  const file = path.join(LOCAL_DIR, key);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, body);
  await fs.writeFile(`${file}.type`, contentType);
  return key;
}

export async function readFile(key: string): Promise<{ body: Buffer; contentType: string } | null> {
  safeKey(key);
  if (blobConfigured()) {
    const res = await get(key, { access: "private" });
    if (!res || !res.stream) return null;
    const body = Buffer.from(await new Response(res.stream).arrayBuffer());
    return { body, contentType: res.blob.contentType ?? "application/octet-stream" };
  }
  try {
    const file = path.join(LOCAL_DIR, key);
    const [body, contentType] = await Promise.all([fs.readFile(file), fs.readFile(`${file}.type`, "utf8")]);
    return { body, contentType };
  } catch {
    return null;
  }
}

export const MAX_LOGO_BYTES = 2 * 1024 * 1024;

/** Checks an uploaded logo's type by its first bytes, not by what the browser claims. SVG is refused (it can carry script). */
export function sniffImage(buf: Buffer): { type: string; ext: string } | null {
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { type: "image/png", ext: "png" };
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return { type: "image/jpeg", ext: "jpg" };
  if (buf.subarray(0, 4).toString() === "RIFF" && buf.subarray(8, 12).toString() === "WEBP") return { type: "image/webp", ext: "webp" };
  return null;
}
