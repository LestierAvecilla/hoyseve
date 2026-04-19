import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users, accounts, sessions, verificationTokens } from "@/lib/schema";
import { eq } from "drizzle-orm";

const authSecret = process.env.AUTH_SECRET;
const googleClientId = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!authSecret) {
  throw new Error("AUTH_SECRET is required");
}

if (!googleClientId || !googleClientSecret) {
  throw new Error("Google OAuth environment variables are required");
}

const config: NextAuthConfig = {
  secret: authSecret,
  trustHost: true,
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
  },
  providers: [
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
    }),
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, credentials.email as string))
          .limit(1);

        if (!user || !user.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password as string,
          user.passwordHash
        );
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name, image: user.image };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger, session: sessionUpdate }) {
      if (user) {
        token.id = user.id;
        // Fetch username from DB on first sign-in
        if (user.id) {
          const [dbUser] = await db
            .select({ username: users.username })
            .from(users)
            .where(eq(users.id, user.id))
            .limit(1);
          token.username = dbUser?.username ?? null;
        }
      }

      // On session.update() call, re-fetch fresh data from DB
      if (trigger === "update" && token.id) {
        const [dbUser] = await db
          .select({ name: users.name, username: users.username, image: users.image })
          .from(users)
          .where(eq(users.id, token.id as string))
          .limit(1);
        if (dbUser) {
          token.name = dbUser.name;
          token.username = dbUser.username ?? null;
          token.picture = dbUser.image ?? null;
        }
        // Also merge any fields passed via update() as a fallback
        if (sessionUpdate?.username !== undefined) {
          token.username = sessionUpdate.username;
        }
      }

      return token;
    },
    async session({ session, token, user }) {
      if (token?.id) {
        session.user.id = token.id as string;
      }
      if (token?.username !== undefined) {
        session.user.username = token.username as string | null;
      }
      // Transferir imagen: de OAuth (user.image) o del token actualizado (picture)
      if (user?.image) {
        session.user.image = user.image;
      } else if (token?.picture) {
        session.user.image = token.picture as string;
      }
      return session;
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(config);
