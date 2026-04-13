import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as alertService from "@/services/alert.service";

export async function GET() {
  try {
    await requireAuth();

    const count = await alertService.getUnreadCount();

    return NextResponse.json({ success: true, data: { count } });
  } catch (error) {
    return handleApiError(error);
  }
}
