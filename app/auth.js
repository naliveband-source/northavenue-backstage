import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { sql } from "../lib/db";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
    Credentials({
      credentials: { email: {}, password: {} },
      async authorize(credentials) {
        const rows = await sql`SELECT * FROM users WHERE email = ${credentials.email} AND (archived = false OR archived IS NULL)`;
        const user = rows[0];
        if (!user || !user.password_hash) return null;
        const ok = await bcrypt.compare(credentials.password, user.password_hash);
        if (!ok) return null;
        if (user.status === "invited" || user.status === "pending") {
          await sql`UPDATE users SET status = 'active' WHERE id = ${user.id}`;
        }
        return {
          id: user.id,
          email: user.email,
          name: `${user.first} ${user.last}`,
          role: user.role,
          isAdmin: user.is_admin,
        };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "google") {
        const rows = await sql`SELECT * FROM users WHERE email = ${user.email} AND (archived = false OR archived IS NULL)`;
        if (rows.length === 0) {
          // No DB match — invitation flow. Mark so jwt callback doesn't store the
          // NextAuth-generated UUID as token.id (finalize checks token.id === undefined).
          user._invitationFlow = true;
          user.googleId = profile.sub;
          user.googleEmail = profile.email;
          user.googlePicture = profile.picture;
          return true;
        }
        const dbUser = rows[0];
        await sql`UPDATE users SET google_id = ${profile.sub}, email_verified = NOW(), status = 'active' WHERE id = ${dbUser.id}`;
        user.id = dbUser.id;
        user.role = dbUser.role;
        user.isAdmin = dbUser.is_admin;
        user.googleId = profile.sub;
        user.googleEmail = profile.email;
        user.googlePicture = profile.picture;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account?.provider === "google" && profile) {
        token.googleId = profile.sub;
        token.googleEmail = profile.email;
        token.googlePicture = profile.picture;
      }
      if (user) {
        // For invitation-flow Google logins user._invitationFlow is true and user.id
        // is NextAuth's auto-generated UUID — don't store it; finalize will link later.
        if (!user._invitationFlow) {
          token.id = user.id;
        }
        token.role = user.role;
        token.isAdmin = user.isAdmin;
      }
      if (!user && token.id) {
        const rows = await sql`SELECT archived FROM users WHERE id = ${token.id}`;
        if (rows[0]?.archived) return null;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.id;
      session.user.role = token.role;
      session.user.isAdmin = token.isAdmin;
      session.user.googleId = token.googleId;
      session.user.googleEmail = token.googleEmail;
      return session;
    },
  },
  session: { strategy: "jwt" },
  secret: process.env.NEXTAUTH_SECRET,
  pages: { signIn: "/login" },
});
