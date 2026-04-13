import { getServerSession } from "next-auth";
import { authOptions } from "./auth-options";
import { NextResponse } from "next/server";
import type { SessionUser } from "@/types";

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return session.user as SessionUser;
}

export async function requireAuth(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user) {
    throw new Error("Unauthorized");
  }
  return user;
}

export async function requirePermission(permission: string): Promise<SessionUser> {
  const user = await requireAuth();
  if (!user.permissions.includes(permission)) {
    throw new Error("Forbidden");
  }
  return user;
}

export function handleApiError(error: unknown) {
  const message = error instanceof Error ? error.message : "Internal server error";

  if (message === "Unauthorized") {
    return NextResponse.json({ success: false, error: message }, { status: 401 });
  }
  if (message === "Forbidden") {
    return NextResponse.json({ success: false, error: message }, { status: 403 });
  }

  console.error("API Error:", error);
  return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
}
