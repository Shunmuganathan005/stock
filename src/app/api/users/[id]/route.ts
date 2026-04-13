import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.USERS_MANAGE);

    const { id } = await params;
    const user = await userService.getUser(id);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.USERS_MANAGE);

    const { id } = await params;
    const body = await request.json();
    const { name, email, roleId, isActive } = body;

    const user = await userService.updateUser(id, {
      name,
      email,
      roleId,
      isActive,
    });

    return NextResponse.json({ success: true, data: user });
  } catch (error) {
    return handleApiError(error);
  }
}
