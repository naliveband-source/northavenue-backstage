import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

// Add hs_id column to store HubSpot ID separately
await sql`ALTER TABLE bookings ADD COLUMN IF NOT EXISTS hs_id TEXT UNIQUE`;
await sql`ALTER TABLE alias_bookings ADD COLUMN IF NOT EXISTS hs_id TEXT UNIQUE`;

console.log("✅ Database opdateret!");