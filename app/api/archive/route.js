import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const [bookings, aliasBookings, payments, users] = await Promise.all([
      sql`SELECT * FROM bookings WHERE archived = true ORDER BY archived_at DESC`,
      sql`SELECT * FROM alias_bookings WHERE archived = true ORDER BY archived_at DESC`,
      sql`SELECT * FROM payments WHERE archived = true ORDER BY date DESC`,
      sql`SELECT * FROM users WHERE archived = true ORDER BY id`,
    ]);

    return NextResponse.json({
      bookings: bookings.map(b => ({ ...b, _type: "booking" })),
      aliasBookings: aliasBookings.map(b => ({ ...b, _type: "alias_booking" })),
      payments: payments.map(p => ({ ...p, _type: "payment" })),
      users: users.map(u => ({ ...u, _type: "user" })),
    });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { type, id, restore } = await req.json();
    if(!restore) return NextResponse.json({ error: "Only restore:true is supported" }, { status: 400 });
    if(!type || !id) return NextResponse.json({ error: "type and id are required" }, { status: 400 });

    if(type === "booking") {
      await sql`UPDATE bookings SET archived = false, archived_at = NULL WHERE id = ${id}`;
    } else if(type === "alias_booking") {
      await sql`UPDATE alias_bookings SET archived = false, archived_at = NULL WHERE id = ${id}`;
    } else if(type === "payment") {
      await sql`UPDATE payments SET archived = false WHERE id = ${id}`;
    } else if(type === "user") {
      await sql`UPDATE users SET archived = false WHERE id = ${id}`;
    } else {
      return NextResponse.json({ error: `Unknown type: ${type}` }, { status: 400 });
    }

    return NextResponse.json({ ok: true, restored: { type, id } });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
