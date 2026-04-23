import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS color TEXT DEFAULT ''`;
console.log("✅ color column added to users table");
