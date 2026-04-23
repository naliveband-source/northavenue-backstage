import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

// Make id auto-generate if not provided
await sql`ALTER TABLE alias_bookings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`;
await sql`ALTER TABLE bookings ALTER COLUMN id SET DEFAULT gen_random_uuid()::text`;

console.log("✅ Database fikset!");