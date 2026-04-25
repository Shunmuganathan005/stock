import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

// ─── Constants ──────────────────────────────────────────────

const SESSION_COOKIE = "session-token";
const SESSION_MAX_AGE = 3 * 24 * 60 * 60; // 3 days in seconds

// ─── Types ──────────────────────────────────────────────────

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  organizationId: string;
  isOwner: boolean;
  roleId: string;
  roleName: string;
};

type AuthHandler = (
  request: Request,
  user: SessionUser
) => Promise<NextResponse>;

// ─── Session Lookup ─────────────────────────────────────────

export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { sessionToken: token },
    include: {
      user: { include: { role: true } },
    },
  });

  if (!session || session.expires < new Date()) return null;
  if (!session.user.isActive) return null;

  return {
    id: session.user.id,
    name: session.user.name,
    email: session.user.email,
    organizationId: session.user.organizationId,
    isOwner: session.user.isOwner,
    roleId: session.user.role.id,
    roleName: session.user.role.name,
  };
}

// ─── Permission Lookup ──────────────────────────────────────

export async function getUserPermissions(
  userId: string
): Promise<string[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          rolePermissions: { include: { permission: true } },
        },
      },
    },
  });
  return user?.role.rolePermissions.map((rp) => rp.permission.name) ?? [];
}

// ─── Login / Logout ─────────────────────────────────────────

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw new Error("Invalid email or password");

  const isValid = await bcrypt.compare(password, user.hashedPassword);
  if (!isValid) throw new Error("Invalid email or password");

  // Create session row in DB
  const sessionToken = randomUUID();
  await prisma.session.create({
    data: {
      sessionToken,
      userId: user.id,
      expires: new Date(Date.now() + SESSION_MAX_AGE * 1000),
    },
  });

  // Set cookie so subsequent requests are authenticated
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return { id: user.id, name: user.name, email: user.email };
}

export async function logout() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;

  if (token) {
    await prisma.session.deleteMany({ where: { sessionToken: token } });
  }

  cookieStore.delete(SESSION_COOKIE);
}

// ─── Decorators ─────────────────────────────────────────────

export function withSession(handler: AuthHandler) {
  return async (request: Request) => {
    const user = await getSessionUser();
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    try {
      return await handler(request, user);
    } catch (error) {
      return handleApiError(error);
    }
  };
}

export function withPermission(permission: string, handler: AuthHandler) {
  return withSession(async (request, user) => {
    const permissions = await getUserPermissions(user.id);
    if (!permissions.includes(permission)) {
      return NextResponse.json(
        { success: false, error: "Forbidden" },
        { status: 403 }
      );
    }
    return handler(request, user);
  });
}

// ─── Error Handler ──────────────────────────────────────────

function handleApiError(error: unknown) {
  const message =
    error instanceof Error ? error.message : "Internal server error";
  console.error("API Error:", error);
  return NextResponse.json(
    { success: false, error: message },
    { status: 500 }
  );
}
