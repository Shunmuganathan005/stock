import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as alertService from "@/services/alert.service";

export const GET = withSession(async (request, user) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const isRead = searchParams.get("isRead");

  const result = await alertService.listAlerts(
    {
      page,
      pageSize,
      isRead: isRead === null ? undefined : isRead === "true",
    },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: result });
});
