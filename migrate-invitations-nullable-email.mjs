import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE invitations ALTER COLUMN email DROP NOT NULL`;
await sql`ALTER TABLE invitations ALTER COLUMN email SET DEFAULT ''`;

console.log("✅ invitations.email is now nullable");
