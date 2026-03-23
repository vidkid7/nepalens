import type { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { prisma } from "@nepalens/database";
import crypto from "crypto";
import {
  ACCESS_TOKEN_MAX_AGE,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} from "./tokens";

async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  const [salt, key] = hash.split(":");
  return new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      resolve(derivedKey.toString("hex") === key);
    });
  });
}

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Email",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user || !user.passwordHash) return null;
        if (user.isBanned) return null;

        const valid = await verifyPassword(credentials.password, user.passwordHash);
        if (!valid) return null;

        await prisma.user.update({
          where: { id: user.id },
          data: { lastLoginAt: new Date() },
        });

        // Create refresh token on login
        const ip = req?.headers?.["x-forwarded-for"] as string | undefined;
        const ua = req?.headers?.["user-agent"] as string | undefined;
        const { rawToken, family } = await createRefreshToken(user.id, undefined, {
          ipAddress: ip,
          userAgent: ua,
        });

        return {
          id: user.id,
          email: user.email,
          name: user.displayName || user.username,
          image: user.avatarUrl,
          refreshToken: rawToken,
          refreshTokenFamily: family,
        };
      },
    }),
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        let existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          const username = user.email!.split("@")[0].replace(/[^a-z0-9]/gi, "").toLowerCase();
          let uniqueUsername = username;
          let counter = 1;
          while (await prisma.user.findUnique({ where: { username: uniqueUsername } })) {
            uniqueUsername = `${username}${counter++}`;
          }
          existing = await prisma.user.create({
            data: {
              email: user.email!,
              username: uniqueUsername,
              displayName: user.name || uniqueUsername,
              avatarUrl: user.image || undefined,
              oauthProvider: "google",
              oauthUid: account.providerAccountId,
              isVerified: true,
            },
          });
        }
        // Create refresh token for Google OAuth users too
        const { rawToken, family } = await createRefreshToken(existing.id);
        (user as any).refreshToken = rawToken;
        (user as any).refreshTokenFamily = family;
      }
      return true;
    },

    async jwt({ token, user, trigger }) {
      // Initial sign-in — populate token with user data + refresh token
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
          select: { id: true, username: true, isAdmin: true, isContributor: true },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          token.username = dbUser.username;
          token.isAdmin = dbUser.isAdmin;
          token.isContributor = dbUser.isContributor;
        }
        token.refreshToken = (user as any).refreshToken;
        token.refreshTokenFamily = (user as any).refreshTokenFamily;
        token.accessTokenExpires = Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
        return token;
      }

      // Subsequent requests — check if access token is still valid
      if (typeof token.accessTokenExpires === "number" && Date.now() < token.accessTokenExpires) {
        return token;
      }

      // Access token expired — try to rotate the refresh token
      if (token.refreshToken && typeof token.refreshToken === "string") {
        try {
          const result = await rotateRefreshToken(token.refreshToken);
          if (result) {
            // Refresh user data from DB (roles may have changed)
            const freshUser = await prisma.user.findUnique({
              where: { id: result.userId },
              select: { id: true, username: true, isAdmin: true, isContributor: true, isBanned: true },
            });

            if (freshUser && !freshUser.isBanned) {
              token.userId = freshUser.id;
              token.username = freshUser.username;
              token.isAdmin = freshUser.isAdmin;
              token.isContributor = freshUser.isContributor;
              token.refreshToken = result.rawToken;
              token.refreshTokenFamily = result.family;
              token.accessTokenExpires = Date.now() + ACCESS_TOKEN_MAX_AGE * 1000;
              return token;
            }
          }
        } catch {
          // Refresh failed — fall through to expire
        }
      }

      // Refresh failed — mark token as expired so client re-authenticates
      token.error = "RefreshTokenExpired";
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.userId;
        (session.user as any).username = token.username;
        (session.user as any).isAdmin = token.isAdmin;
        (session.user as any).isContributor = token.isContributor;
      }
      // Expose token error to client so it can force re-login
      (session as any).error = token.error;
      return session;
    },
  },

  events: {
    async signOut(message) {
      // Revoke refresh token on explicit sign-out
      const token = (message as any).token;
      if (token?.refreshToken && typeof token.refreshToken === "string") {
        await revokeRefreshToken(token.refreshToken).catch(() => {});
      }
    },
  },

  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days — outer container; real expiry managed by accessTokenExpires
  },
  secret: process.env.NEXTAUTH_SECRET,
};
