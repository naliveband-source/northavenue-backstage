import { sql } from "../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../auth";

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const payments = await sql`SELECT * FROM payments WHERE (archived = false OR archived IS NULL) ORDER BY date`;
    return NextResponse.json(payments);
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

export async function POST(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    await sql`UPDATE payments SET archived = true WHERE id = ${id}`;
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
