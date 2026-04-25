import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { auth } from "../../../auth";

export async function PUT(req) {
  const session = await auth();
  if (!session?.user?.isAdmin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  try {
    const { ids } = await req.json();
    if (!Array.isArray(ids) || ids.length === 0)
      return NextResponse.json({ error: "ids must be non-empty array" }, { status: 400 });
    for (let i = 0; i < ids.length; i++) {
      await sql`UPDATE users SET display_order = ${i + 1} WHERE id = ${ids[i]}`;
    }
    return NextResponse.json({ ok: true, updated: ids.length });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
