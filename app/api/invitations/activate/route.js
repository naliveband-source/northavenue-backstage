import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import bcrypt from "bcryptjs";

export async function POST(req) {
  const { token, method, email, password } = await req.json();
  if (!token || !method) return NextResponse.json({ error: "token and method required" }, { status: 400 });

  const rows = await sql`
    SELECT i.token, i.user_id, i.expires_at, i.used_at
    FROM invitations i
    WHERE i.token = ${token}
  `;
  if (!rows.length) return NextResponse.json({ error: "notfound" }, { status: 404 });

  const inv = rows[0];
  if (inv.used_at) return NextResponse.json({ error: "used" }, { status: 409 });
  if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ error: "expired" }, { status: 410 });

  if (method === "password") {
    if (!email || !email.includes("@")) {
      return NextResponse.json({ error: "Ugyldig email-adresse" }, { status: 400 });
    }
    if (!password || password.length < 6) {
      return NextResponse.json({ error: "Adgangskode skal være mindst 6 tegn" }, { status: 400 });
    }
    // Check email not already taken by another user
    const taken = await sql`SELECT id FROM users WHERE email = ${email} AND id != ${inv.user_id} AND (archived = false OR archived IS NULL)`;
    if (taken.length) return NextResponse.json({ error: "Email er allerede i brug af en anden bruger" }, { status: 409 });

    const hash = await bcrypt.hash(password, 12);
    await sql`UPDATE users SET email = ${email}, password_hash = ${hash}, status = 'active' WHERE id = ${inv.user_id}`;
    await sql`UPDATE invitations SET used_at = NOW() WHERE token = ${token}`;
    return NextResponse.json({ ok: true, email });
  }

  // For google: don't mark used here — finalize endpoint handles it after OAuth
  return NextResponse.json({ error: "Unknown method" }, { status: 400 });
}
