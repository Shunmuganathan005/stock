import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as alertService from "@/services/alert.service";

export const POST = withSession(async (_request, user) => {
  await alertService.markAllAsRead(user.organizationId);

  return NextResponse.json({ success: true, message: "All alerts marked as read" });
});
