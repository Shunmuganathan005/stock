import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/backend/auth/permissions";
import * as alertService from "@/backend/services/alert.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const alert = await alertService.markAsRead(id);

    return NextResponse.json({ success: true, data: alert });
  } catch (error) {
    return handleApiError(error);
  }
}
