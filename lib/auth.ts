import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { updateStreak } from "./gamification";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as NextAuthOptions["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    newUser: "/register",
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        const dbUser = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
          await updateStreak(dbUser.id);
        }
      }
      if (trigger === "update") {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
        });
        if (dbUser) {
          token.role = dbUser.role;
          token.hasCompletedOnboarding = dbUser.hasCompletedOnboarding;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        session.user.hasCompletedOnboarding = Boolean(
          token.hasCompletedOnboarding
        );
      }
      return session;
    },
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const existing = await prisma.user.findUnique({
          where: { email: user.email! },
        });
        if (!existing) {
          await prisma.user.create({
            data: {
              email: user.email!,
              name: user.name || "User",
              role: "STUDENT",
              avatar: user.image,
            },
          });
        }
      }
      return true;
    },
  },
};

export async function getSession() {
  return getServerSession(authOptions);
}

export async function requireAuth() {
  const session = await getSession();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session;
}

export async function requireTeacher() {
  const session = await requireAuth();
  if (session.user.role !== "TEACHER") throw new Error("Forbidden");
  return session;
}
