import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { auth } from "../../../auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXTAUTH_URL || "https://backstage.northavenue.dk";

  console.log("[finalize] start token=", token);

  try {
    const session = await auth();
    console.log("[finalize] session.user=", JSON.stringify(session?.user));

    // A session with a real DB id belongs to a linked user — send them home.
    // For invitation-flow Google logins, token.id was intentionally left unset,
    // so session.user.id will be undefined here.
    if (session?.user?.id) {
      console.log("[finalize] already-linked user, redirecting home");
      return NextResponse.redirect(`${baseUrl}/`);
    }

    if (!session?.user?.googleId || !session?.user?.googleEmail) {
      console.log("[finalize] no google identity in session");
      return NextResponse.redirect(`${baseUrl}/login?error=no_google_session`);
    }

    if (!token) {
      console.log("[finalize] missing token");
      return NextResponse.redirect(`${baseUrl}/login?error=missing_token`);
    }

    const invRows = await sql`
      SELECT i.token, i.user_id, i.expires_at, i.used_at
      FROM invitations i
      WHERE i.token = ${token}
    `;
    console.log("[finalize] invitation rows=", invRows.length);
    if (!invRows.length) return NextResponse.redirect(`${baseUrl}/invitation/error?reason=notfound`);
    const inv = invRows[0];
    if (inv.used_at) return NextResponse.redirect(`${baseUrl}/invitation/error?reason=used`);
    if (new Date(inv.expires_at) < new Date()) return NextResponse.redirect(`${baseUrl}/invitation/error?reason=expired`);

    // Verify the Google email isn't already owned by a different active user
    const emailTaken = await sql`
      SELECT id FROM users
      WHERE email = ${session.user.googleEmail}
        AND id != ${inv.user_id}
        AND (archived = false OR archived IS NULL)
    `;
    if (emailTaken.length) {
      console.log("[finalize] email already taken by another user");
      return NextResponse.redirect(`${baseUrl}/invitation/error?reason=email_taken`);
    }

    // Verify the Google account isn't already linked to a different user
    const googleTaken = await sql`
      SELECT id FROM users
      WHERE google_id = ${session.user.googleId}
        AND id != ${inv.user_id}
        AND (archived = false OR archived IS NULL)
    `;
    if (googleTaken.length) {
      console.log("[finalize] google account already linked to another user");
      return NextResponse.redirect(`${baseUrl}/invitation/error?reason=google_taken`);
    }

    // Link the Google account to the pre-created invited user row
    console.log("[finalize] updating user id=", inv.user_id);
    await sql`
      UPDATE users
      SET email          = ${session.user.googleEmail},
          google_id      = ${session.user.googleId},
          email_verified = NOW(),
          status         = 'active',
          updated_at     = NOW()
      WHERE id = ${inv.user_id}
    `;
    await sql`UPDATE invitations SET used_at = NOW() WHERE token = ${token}`;
    console.log("[finalize] update complete");

    const userRows = await sql`SELECT first FROM users WHERE id = ${inv.user_id}`;
    const firstName = userRows[0]?.first || "";

    return NextResponse.redirect(
      `${baseUrl}/invitation/success?first=${encodeURIComponent(firstName)}`
    );
  } catch (e) {
    console.error("[finalize] error:", e);
    return NextResponse.redirect(`${baseUrl}/invitation/error?reason=server_error`);
  }
}
