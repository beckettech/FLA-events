import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import EmailProvider from "next-auth/providers/email";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST || "smtp.zoho.com",
        port: Number(process.env.EMAIL_SERVER_PORT) || 465,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM || "noreply@flaevents.com",
      // For development without email server configured
      ...((!process.env.EMAIL_SERVER_USER || !process.env.EMAIL_SERVER_PASSWORD) && {
        sendVerificationRequest: async ({ identifier, url }) => {
          console.log("\n🔐 Magic Link Sign-In");
          console.log("Email:", identifier);
          console.log("Magic Link URL:", url);
          console.log("\nℹ️  Email server not configured. Check console for magic link.\n");
          // In development, just log the URL - user would need to copy it
        },
      }),
    }),
  ],
  pages: {
    signIn: "/auth/signin",
    verifyRequest: "/auth/verify-request",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.sub as string;
      }
      return session;
    },
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
      }
      return token;
    },
  },
  events: {
    async createUser({ user }) {
      console.log("✅ New user created:", user.email);
    },
  },
  debug: process.env.NODE_ENV === "development",
};
