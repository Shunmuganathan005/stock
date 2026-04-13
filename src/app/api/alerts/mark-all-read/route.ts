import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as alertService from "@/services/alert.service";

export async function PUT() {
  try {
    await requireAuth();

    await alertService.markAllAsRead();

    return NextResponse.json({ success: true, message: "All alerts marked as read" });
  } catch (error) {
    return handleApiError(error);
  }
}
