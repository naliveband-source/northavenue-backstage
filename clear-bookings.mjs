import { neon } from "@neondatabase/serverless";

const sql = neon("postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require");

// Slet ALT bookingdata så vi starter frisk
await sql`DELETE FROM bookings`;
await sql`DELETE FROM alias_bookings`;

console.log("✅ Alle bookinger slettet — klar til ren HubSpot-sync!");
