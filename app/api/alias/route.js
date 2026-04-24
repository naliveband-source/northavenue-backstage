import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const bookings = await sql`SELECT * FROM alias_bookings WHERE (archived = false OR archived IS NULL) ORDER BY date`;
    return NextResponse.json(bookings.map(b => ({
      ...b,
      bandPay: b.band_pay,
      bookingFee: b.booking_fee,
      carGear: b.car_gear,
      playTime: b.play_time,
      managerUserId: b.manager_user_id,
    })));
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const booking = await sql`
      INSERT INTO alias_bookings (id, manager_user_id, date, type, city, address, arrival, play_time, sets, musicians, band_pay, booking_fee, car_gear, contact, phone, booker, notes)
      VALUES (${b.id}, ${b.managerUserId}, ${b.date}, ${b.type}, ${b.city}, ${b.address||''}, ${b.arrival||''}, ${b.playTime||''}, ${b.sets||''}, ${b.musicians||0}, ${b.bandPay||0}, ${b.bookingFee||0}, ${b.carGear||false}, ${b.contact||''}, ${b.phone||''}, ${b.booker||''}, ${b.notes||''})
      ON CONFLICT (id) DO UPDATE SET
        date=EXCLUDED.date, type=EXCLUDED.type, city=EXCLUDED.city,
        address=EXCLUDED.address, arrival=EXCLUDED.arrival, play_time=EXCLUDED.play_time,
        sets=EXCLUDED.sets, musicians=EXCLUDED.musicians, band_pay=EXCLUDED.band_pay,
        booking_fee=EXCLUDED.booking_fee, car_gear=EXCLUDED.car_gear,
        contact=EXCLUDED.contact, phone=EXCLUDED.phone,
        booker=EXCLUDED.booker, notes=EXCLUDED.notes
      RETURNING *`;
    return NextResponse.json(booking[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await sql`UPDATE alias_bookings SET archived = true, archived_at = NOW() WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
