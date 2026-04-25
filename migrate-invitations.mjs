import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending'`;
await sql`UPDATE users SET status = 'active' WHERE google_id IS NOT NULL OR password_hash IS NOT NULL`;

await sql`CREATE TABLE IF NOT EXISTS invitations (
  token TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
)`;

console.log("✅ Invitations table + status column ready");
