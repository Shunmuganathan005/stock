import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as userService from "@/services/user.service";

export async function PUT(request: Request) {
  try {
    const user = await requireAuth();

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
  } catch (error) {
    return handleApiError(error);
  }
}
