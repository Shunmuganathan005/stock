import { NextResponse } from "next/server";
import { getSessionUser, getUserPermissions } from "@/lib/auth";

export async function GET() {
  const user = await getSessionUser();
  if (!user) {
    return NextResponse.json(
      { success: false, error: "Not authenticated" },
      { status: 401 }
    );
  }

  const permissions = await getUserPermissions(user.id);

  return NextResponse.json({
    success: true,
    data: { ...user, permissions },
  });
}
