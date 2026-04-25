import { NextResponse } from "next/server";
import { sql } from "../../../lib/db";
import { auth } from "../../auth";
import crypto from "crypto";

const BASE_URL = process.env.NEXTAUTH_URL || "https://backstage.northavenue.dk";

// GET — validate a token (public, no auth required)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ valid: false, reason: "notfound" });

    const rows = await sql`
      SELECT i.token, i.expires_at, i.used_at,
             u.first, u.last, u.role, u.status
      FROM invitations i
      JOIN users u ON u.id = i.user_id
      WHERE i.token = ${token}
    `;
    if (!rows.length) return NextResponse.json({ valid: false, reason: "notfound" });

    const inv = rows[0];
    if (inv.used_at) return NextResponse.json({ valid: false, reason: "used" });
    if (new Date(inv.expires_at) < new Date()) return NextResponse.json({ valid: false, reason: "expired" });

    return NextResponse.json({
      valid: true,
      firstName: inv.first,
      lastName: inv.last,
      role: inv.role,
    });
  } catch (e) {
    console.error("Invitation GET error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// POST — admin creates invitation for an existing user (email not required)
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const { userId, expiresInDays = 14 } = body;
    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });

    // Invalidate any existing unused invitation for this user first
    await sql`DELETE FROM invitations WHERE user_id = ${userId} AND used_at IS NULL`;

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO invitations (token, user_id, email, expires_at)
      VALUES (${token}, ${userId}, '', ${expiresAt.toISOString()})
    `;
    await sql`UPDATE users SET status = 'invited' WHERE id = ${userId}`;

    const link = `${BASE_URL}/invitation/${token}`;
    return NextResponse.json({ token, link });
  } catch (e) {
    console.error("Invitation POST error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

// DELETE — admin revokes an invitation
export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) return NextResponse.json({ error: "token required" }, { status: 400 });

    const rows = await sql`DELETE FROM invitations WHERE token = ${token} RETURNING user_id`;
    if (rows.length) {
      await sql`UPDATE users SET status = 'pending' WHERE id = ${rows[0].user_id}`;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Invitation DELETE error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
