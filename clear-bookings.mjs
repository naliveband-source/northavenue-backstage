import { neon } from "@neondatabase/serverless";

const sql = neon(
  "postgresql://neondb_owner:npg_H2MDlEmCq3sn@ep-lucky-tree-alan1dtk.c-3.eu-central-1.aws.neon.tech/neondb?sslmode=require"
);

const r1 = await sql`DELETE FROM bookings`;
console.log(`Deleted rows from bookings`);

const r2 = await sql`DELETE FROM alias_bookings`;
console.log(`Deleted rows from alias_bookings`);

console.log("Done.");
