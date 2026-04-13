import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as alertService from "@/services/alert.service";

export async function GET(request: Request) {
  try {
    await requireAuth();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const isRead = searchParams.get("isRead");

    const result = await alertService.listAlerts({
      page,
      pageSize,
      isRead: isRead === null ? undefined : isRead === "true",
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}
