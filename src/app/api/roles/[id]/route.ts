import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export const GET = withPermission(PERMISSIONS.ROLES_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;

  const role = await userService.getRole(id, user.organizationId);

  if (!role) {
    return NextResponse.json(
      { success: false, error: "Role not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: role });
});

export const PUT = withPermission(PERMISSIONS.ROLES_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;
  const body = await request.json();
  const { name, description, permissionIds } = body;

  const role = await userService.updateRole(
    id,
    { name, description, permissionIds },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: role });
});

export const DELETE = withPermission(PERMISSIONS.ROLES_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;

  await userService.deleteRole(id, user.organizationId);

  return NextResponse.json({ success: true, message: "Role deleted" });
});
