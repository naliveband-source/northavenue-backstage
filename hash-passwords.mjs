import { neon } from "@neondatabase/serverless";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const sql = neon(process.env.DATABASE_URL);

async function hashPasswords() {
  const users = await sql`SELECT id, password FROM users WHERE password IS NOT NULL AND password != '' AND password_hash IS NULL`;
  console.log(`Found ${users.length} users to hash`);
  for (const u of users) {
    const hash = await bcrypt.hash(u.password, 12);
    await sql`UPDATE users SET password_hash = ${hash} WHERE id = ${u.id}`;
    console.log(`Hashed password for user ${u.id}`);
  }
  console.log("Done");
}

hashPasswords().catch(e => { console.error(e); process.exit(1); });
