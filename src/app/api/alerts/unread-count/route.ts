import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as alertService from "@/services/alert.service";

export const GET = withSession(async (request, user) => {
  const count = await alertService.getUnreadCount(user.organizationId);

  return NextResponse.json({ success: true, data: { count } });
});
