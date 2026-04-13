import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.ROLES_MANAGE);

    const { id } = await params;
    const role = await userService.getRole(id);

    if (!role) {
      return NextResponse.json(
        { success: false, error: "Role not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.ROLES_MANAGE);

    const { id } = await params;
    const body = await request.json();
    const { name, description, permissionIds } = body;

    const role = await userService.updateRole(id, {
      name,
      description,
      permissionIds,
    });

    return NextResponse.json({ success: true, data: role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.ROLES_MANAGE);

    const { id } = await params;
    await userService.deleteRole(id);

    return NextResponse.json({ success: true, message: "Role deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
