import { neon } from "@neondatabase/serverless";
import { readFileSync } from "node:fs";
const url = process.env.DATABASE_URL!;
const sql = neon(url);
const file = readFileSync(process.argv[2], "utf8");
const stmts = file.split(/;\s*$/m).map((s) => s.replace(/^\s*--.*$/gm, "").trim()).filter(Boolean);
for (const s of stmts) { await sql.query(s); }
const t = await sql.query("select table_name from information_schema.tables where table_schema='public' order by 1");
console.log(t.map((r: any) => r.table_name).join(", "));
