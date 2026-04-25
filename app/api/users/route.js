import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../auth";
import { syncEnrollment } from "../../../lib/booking-enrollment";

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

    // Enforce musiker XOR vikar (musiker wins)
    let tags = Array.isArray(b.tags) ? b.tags : [];
    if (tags.includes('musiker') && tags.includes('vikar')) {
      console.warn('[users] stripped conflicting vikar tag from', b.id);
      tags = tags.filter(t => t !== 'vikar');
    }

    // Fetch existing user for old tags and musician_id
    const existing = await sql`SELECT * FROM users WHERE id = ${b.id}`;
    const oldUser = existing[0] || null;
    const oldTags = JSON.parse(oldUser?.tags || '[]');

    // Assign musician_id via sequence only for brand-new musiker/vikar users
    let musicianId = b.musicianId ?? null;
    if (!musicianId && (tags.includes('musiker') || tags.includes('vikar'))) {
      if (!oldUser) {
        const seq = await sql`SELECT nextval('musician_id_seq') AS new_id`;
        musicianId = Number(seq[0].new_id);
      } else {
        musicianId = oldUser.musician_id ?? null;
      }
    }

    const user = await sql`
      INSERT INTO users (id, email, password, first, last, initials, instrument, phone, role, sub_type, is_admin, tags, theme, musician_id, color, status)
      VALUES (${b.id}, ${email}, ${password}, ${b.first}, ${b.last}, ${b.initials}, ${b.instrument}, ${b.phone}, ${b.role}, ${b.subType}, ${b.isAdmin}, ${JSON.stringify(tags)}, ${b.theme||'dark'}, ${musicianId}, ${b.color||''}, ${b.status||'pending'})
      ON CONFLICT (id) DO UPDATE SET
        email=EXCLUDED.email,
        password=COALESCE(NULLIF(EXCLUDED.password, ''), users.password),
        first=EXCLUDED.first,
        last=EXCLUDED.last, initials=EXCLUDED.initials, instrument=EXCLUDED.instrument,
        phone=EXCLUDED.phone, role=EXCLUDED.role, sub_type=EXCLUDED.sub_type,
        is_admin=EXCLUDED.is_admin, tags=EXCLUDED.tags, theme=EXCLUDED.theme,
        color=EXCLUDED.color
      RETURNING *`;

    // Auto-enroll when tags change
    const savedMusId = user[0]?.musician_id;
    if (savedMusId != null && JSON.stringify(oldTags) !== JSON.stringify(tags)) {
      await syncEnrollment(savedMusId, oldTags, tags).catch(e =>
        console.error('[enrollment error]', e.message)
      );
    }

    return NextResponse.json(user[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const isSelf = session.user.id === id;
  if (!session.user.isAdmin && !isSelf) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    await sql`UPDATE users SET archived = true WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
