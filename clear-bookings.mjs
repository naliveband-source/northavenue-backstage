import { neon } from "@neondatabase/serverless";
const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");
await sql`DELETE FROM bookings`;         // Alle booking-jobs
await sql`DELETE FROM alias_bookings`;   // Alle alias-jobs (inkl. dummy)
console.log("✅ Alle bookinger slettet");
