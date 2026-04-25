import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const bookings = await sql`SELECT * FROM bookings WHERE (archived = false OR archived IS NULL) ORDER BY date`;
    return NextResponse.json(bookings.map(b => ({
      ...b,
      bandPay: b.band_pay,
      playTime: b.play_time,
      memberIds: JSON.parse(b.member_ids || '[]'),
      substituteIds: JSON.parse(b.substitute_ids || '[]'),
    })));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const b = await req.json();
    const booking = await sql`
      INSERT INTO bookings (id, date, departure, arrival, type, city, address, play_time, sets, band_pay, booker, notes, member_ids, substitute_ids)
      VALUES (${b.id||null}, ${b.date}, ${b.departure||''}, ${b.arrival||''}, ${b.type}, ${b.city}, ${b.address||''}, ${b.playTime||''}, ${b.sets||''}, ${b.bandPay||0}, ${b.booker||''}, ${b.notes||''}, ${JSON.stringify(b.memberIds||[])}, ${JSON.stringify(b.substituteIds||[])})
      ON CONFLICT (id) DO UPDATE SET
        date=EXCLUDED.date, departure=EXCLUDED.departure, arrival=EXCLUDED.arrival,
        type=EXCLUDED.type, city=EXCLUDED.city, address=EXCLUDED.address,
        play_time=EXCLUDED.play_time, sets=EXCLUDED.sets, band_pay=EXCLUDED.band_pay,
        booker=EXCLUDED.booker, notes=EXCLUDED.notes,
        member_ids=EXCLUDED.member_ids, substitute_ids=EXCLUDED.substitute_ids
      RETURNING *`;
    return NextResponse.json(booking[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { id } = await req.json();
    await sql`UPDATE bookings SET archived = true, archived_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
