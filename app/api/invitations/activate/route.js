import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { token, method, password } = await req.json();
  if (!token || !method) return NextResponse.json({ error: "token and method required" }, { status: 400 });

  const rows = await sql`
    SELECT i.token, i.user_id, i.email, i.expires_at, i.used_at
    FROM invitations i
    WHERE i.token = ${token}
  `;
  if (!rows.length) return NextResponse.json({ error: "notfound" }, { status: 404 });

  const inv = rows[0];
  if (inv.used_at) return NextResponse.json({ error: "used" }, { status: 409 });
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: "expired" }, { status: 410 });

  if (method === "password") {
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Adgangskode skal være mindst 6 tegn" }, { status: 400 });
    }
    const hash = await bcrypt.hash(password, 12);
    await sql`UPDATE users SET password_hash = ${hash}, status = 'active' WHERE id = ${inv.user_id}`;
  } else if (method === "google") {
    // Google activation: just mark user active — NextAuth signIn callback handles the Google linking
    await sql`UPDATE users SET status = 'active' WHERE id = ${inv.user_id}`;
  } else {
    return NextResponse.json({ error: "Unknown method" }, { status: 400 });
  }

  await sql`UPDATE invitations SET used_at = NOW() WHERE token = ${token}`;
  return NextResponse.json({ ok: true, email: inv.email });
}
