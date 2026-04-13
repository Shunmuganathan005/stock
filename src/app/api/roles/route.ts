import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export async function GET() {
  try {
    await requireAuth();

    const roles = await userService.listRoles();

    return NextResponse.json({ success: true, data: roles });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.ROLES_MANAGE);

    const body = await request.json();
    const { name, description, permissionIds } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const role = await userService.createRole({
      name,
      description: description || "",
      permissionIds: permissionIds || [],
    });

    return NextResponse.json({ success: true, data: role }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
