import { NextResponse } from "next/server";
import { sql } from "../../../../lib/db";
import { auth } from "../../../auth";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");
  const baseUrl = process.env.NEXTAUTH_URL || "https://backstage.northavenue.dk";

  const session = await auth();

  // If session already has a DB-linked user, just redirect home
  if (session?.user?.id) {
    return NextResponse.redirect(`${baseUrl}/`);
  }

  // Must have a Google identity in the session
  if (!session?.user?.googleId || !session?.user?.googleEmail) {
    return NextResponse.redirect(`${baseUrl}/login?error=no_google_session`);
  }

  if (!token) {
    return NextResponse.redirect(`${baseUrl}/login?error=missing_token`);
  }

  // Validate invitation
  const invRows = await sql`
    SELECT i.token, i.user_id, i.expires_at, i.used_at
    FROM invitations i
    WHERE i.token = ${token}
  `;
  if (!invRows.length) return NextResponse.redirect(`${baseUrl}/invitation-error?reason=notfound`);
  const inv = invRows[0];
  if (inv.used_at) return NextResponse.redirect(`${baseUrl}/invitation-error?reason=used`);
  if (new Date(inv.expires_at) < new Date()) return NextResponse.redirect(`${baseUrl}/invitation-error?reason=expired`);

  // Check the Google email isn't already taken by another active user
  const emailTaken = await sql`
    SELECT id FROM users
    WHERE email = ${session.user.googleEmail}
      AND id != ${inv.user_id}
      AND (archived = false OR archived IS NULL)
  `;
  if (emailTaken.length) {
    return NextResponse.redirect(`${baseUrl}/invitation-error?reason=email_taken`);
  }

  // Link Google account to the invited user
  await sql`
    UPDATE users
    SET email        = ${session.user.googleEmail},
        google_id    = ${session.user.googleId},
        email_verified = NOW(),
        status       = 'active'
    WHERE id = ${inv.user_id}
  `;
  await sql`UPDATE invitations SET used_at = NOW() WHERE token = ${token}`;

  // Redirect to login so the user gets a fresh JWT that includes their DB user id.
  // On this second Google login the signIn callback finds them by email.
  return NextResponse.redirect(`${baseUrl}/login?activated=1`);
}
