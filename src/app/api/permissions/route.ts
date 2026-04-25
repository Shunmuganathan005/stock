import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as userService from "@/services/user.service";

export const GET = withSession(async () => {
  const permissions = await userService.listPermissions();

  return NextResponse.json({ success: true, data: permissions });
});
