import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const payments = await sql`SELECT * FROM payments ORDER BY date`;
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const b = await req.json();
    const payment = await sql`
      INSERT INTO payments (id, musician_id, date, amount, note)
      VALUES (${b.id}, ${b.musicianId}, ${b.date}, ${b.amount}, ${b.note})
      ON CONFLICT (id) DO UPDATE SET
        musician_id=EXCLUDED.musician_id, date=EXCLUDED.date,
        amount=EXCLUDED.amount, note=EXCLUDED.note
      RETURNING *`;
    return NextResponse.json(payment[0]);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json();
    await sql`DELETE FROM payments WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}