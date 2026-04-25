import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as userService from "@/services/user.service";

export const PUT = withSession(async (request, user) => {
  const body = await request.json();
  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json(
      { success: false, error: "Current password and new password are required" },
      { status: 400 }
    );
  }

  if (newPassword.length < 6) {
    return NextResponse.json(
      { success: false, error: "New password must be at least 6 characters" },
      { status: 400 }
    );
  }

  await userService.updatePassword(user.id, { currentPassword, newPassword });

  return NextResponse.json({ success: true, message: "Password changed successfully" });
});
