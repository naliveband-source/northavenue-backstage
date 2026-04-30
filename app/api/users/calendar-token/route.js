import { sql } from "../../../../lib/db";
import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { randomUUID } from "crypto";

export async function POST() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const newToken = randomUUID();
    const user = await sql`
      UPDATE users SET calendar_token = ${newToken}
      WHERE id = ${session.user.id}
      RETURNING calendar_token`;
    return NextResponse.json({ calendar_token: user[0].calendar_token });
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
