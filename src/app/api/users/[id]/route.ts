import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export const GET = withPermission(PERMISSIONS.USERS_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;

  const found = await userService.getUser(id, user.organizationId);

  if (!found) {
    return NextResponse.json(
      { success: false, error: "User not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: found });
});

export const PUT = withPermission(PERMISSIONS.USERS_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;
  const body = await request.json();
  const { name, email, roleId, isActive } = body;

  const updated = await userService.updateUser(
    id,
    { name, email, roleId, isActive },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: updated });
});
