import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { auth } from "../../../auth";

export async function PATCH(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { bookingId, musicianId, action } = await req.json();
  if (!bookingId || musicianId == null || !['add', 'remove'].includes(action)) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  if (!session.user.isAdmin) {
    const rows = await sql`SELECT musician_id FROM users WHERE id = ${session.user.id}`;
    if (rows[0]?.musician_id !== musicianId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const rows = await sql`SELECT member_ids FROM bookings WHERE id = ${bookingId}`;
    if (!rows[0]) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

    let memberIds = JSON.parse(rows[0].member_ids || '[]');
    if (action === 'add') {
      if (!memberIds.includes(musicianId)) memberIds.push(musicianId);
    } else {
      memberIds = memberIds.filter(x => x !== musicianId);
    }

    await sql`UPDATE bookings SET member_ids = ${JSON.stringify(memberIds)} WHERE id = ${bookingId}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
