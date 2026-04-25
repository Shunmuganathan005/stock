import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as alertService from "@/services/alert.service";

export const PUT = withSession(async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-2)!;

  const alert = await alertService.markAsRead(id, user.organizationId);

  return NextResponse.json({ success: true, data: alert });
});
