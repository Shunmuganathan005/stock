import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as userService from "@/services/user.service";

export async function GET() {
  try {
    await requireAuth();

    const permissions = await userService.listPermissions();

    return NextResponse.json({ success: true, data: permissions });
  } catch (error) {
    return handleApiError(error);
  }
}
