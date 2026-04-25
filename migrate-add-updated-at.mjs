import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP`;
await sql`UPDATE users SET updated_at = created_at WHERE updated_at IS NULL`;

console.log("✅ users.updated_at added");
