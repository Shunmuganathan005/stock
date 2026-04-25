import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as userService from "@/services/user.service";

export const GET = withPermission(PERMISSIONS.USERS_MANAGE, async (request, user) => {
  const result = await userService.listUsers(user.organizationId);

  return NextResponse.json({ success: true, data: result });
});
