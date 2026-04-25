import { NextResponse } from "next/server";
import { withSession, withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export const GET = withSession(async (request, user) => {
  const roles = await userService.listRoles(user.organizationId);

  return NextResponse.json({ success: true, data: roles });
});

export const POST = withPermission(PERMISSIONS.ROLES_MANAGE, async (request, user) => {
  const body = await request.json();
  const { name, description, permissionIds } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  const role = await userService.createRole(
    {
      name,
      description: description || "",
      permissionIds: permissionIds || [],
    },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: role }, { status: 201 });
});
