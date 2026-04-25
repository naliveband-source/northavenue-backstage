import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const users = await sql`SELECT * FROM users WHERE (archived = false OR archived IS NULL) ORDER BY created_at`;
    return NextResponse.json(users);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const b = await req.json();
    const email = b.email || null;
    const password = b.password || null;
    const user = await sql`
      INSERT INTO users (id, email, password, first, last, initials, instrument, phone, role, sub_type, is_admin, tags, theme, musician_id, color, status)
      VALUES (${b.id}, ${email}, ${password}, ${b.first}, ${b.last}, ${b.initials}, ${b.instrument}, ${b.phone}, ${b.role}, ${b.subType}, ${b.isAdmin}, ${JSON.stringify(b.tags||[])}, ${b.theme||'dark'}, ${b.musicianId||null}, ${b.color||''}, ${b.status||'pending'})
      ON CONFLICT (id) DO UPDATE SET
        email=EXCLUDED.email, password=EXCLUDED.password, first=EXCLUDED.first,
        last=EXCLUDED.last, initials=EXCLUDED.initials, instrument=EXCLUDED.instrument,
        phone=EXCLUDED.phone, role=EXCLUDED.role, sub_type=EXCLUDED.sub_type,
        is_admin=EXCLUDED.is_admin, tags=EXCLUDED.tags, theme=EXCLUDED.theme,
        color=EXCLUDED.color
      RETURNING *`;
    return NextResponse.json(user[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await sql`UPDATE users SET archived = true WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
