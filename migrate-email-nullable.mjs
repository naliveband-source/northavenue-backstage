import { neon } from "@neondatabase/serverless";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

// Make email nullable
await sql`ALTER TABLE users ALTER COLUMN email DROP NOT NULL`;
await sql`ALTER TABLE users ALTER COLUMN email SET DEFAULT NULL`;

// Drop the blanket UNIQUE constraint — it blocks multiple users with no email
await sql`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_email_key`;

// Replace with a partial unique index: only enforces uniqueness for non-empty emails
await sql`CREATE UNIQUE INDEX IF NOT EXISTS users_email_unique_nonempty
  ON users(email)
  WHERE email IS NOT NULL AND email != ''`;

// Make password nullable too — new users use password_hash, not password
await sql`ALTER TABLE users ALTER COLUMN password DROP NOT NULL`;
await sql`ALTER TABLE users ALTER COLUMN password SET DEFAULT NULL`;

// Fix existing users that have '' email so they don't conflict
await sql`UPDATE users SET email = NULL WHERE email = ''`;

console.log("✅ users.email nullable + partial unique index, password nullable");
