import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          include: { role: true },
        });

        if (!user || !user.isActive) {
          throw new Error("Invalid email or password");
        }

        const isValid = await bcrypt.compare(credentials.password, user.hashedPassword);
        if (!isValid) {
          throw new Error("Invalid email or password");
        }

        return {
          id: user.id,
          name: user.name,
          email: user.email,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }

      // Fetch fresh permissions on every token refresh (or first sign-in)
      if (token.id) {
        const fullUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          include: {
            role: {
              include: {
                rolePermissions: {
                  include: { permission: true },
                },
              },
            },
          },
        });

        if (fullUser) {
          token.role = {
            id: fullUser.role.id,
            name: fullUser.role.name,
          };
          token.permissions = fullUser.role.rolePermissions.map(
            (rp: { permission: { name: string } }) => rp.permission.name
          );
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user = {
          ...session.user,
          id: token.id as string,
          role: token.role as { id: string; name: string },
          permissions: (token.permissions as string[]) || [],
        };
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
