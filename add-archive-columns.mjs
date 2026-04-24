import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");
await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`;
await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`;
await sql`ALTER TABLE alias_bookings ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`;
await sql`ALTER TABLE alias_bookings ADD COLUMN IF NOT EXISTS archived_at TIMESTAMP`;
await sql`ALTER TABLE payments ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`;
await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false`;
console.log("✅ Archive columns added");
