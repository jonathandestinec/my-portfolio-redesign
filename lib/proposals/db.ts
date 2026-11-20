import "server-only";
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

/** Neon over HTTPS: no pooled TCP connections to manage in serverless functions. */
let instance: ReturnType<typeof make> | null = null;

function make(url: string) {
  return drizzle(neon(url), { schema });
}

export function proposalsConfigured(): boolean {
  return Boolean(process.env.DATABASE_URL);
}

export function db() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set");
  instance ??= make(url);
  return instance;
}

export { schema };
