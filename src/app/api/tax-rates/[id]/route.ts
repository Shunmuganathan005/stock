import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/backend/auth/permissions";
import { PERMISSIONS } from "@/shared/constants/permissions";
import { prisma } from "@/backend/db/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const { id } = await params;
    const body = await request.json();
    const { name, percentage, isActive } = body;

    const taxRate = await prisma.taxRate.update({
      where: { id },
      data: {
        ...(name !== undefined && { name }),
        ...(percentage !== undefined && { percentage }),
        ...(isActive !== undefined && { isActive }),
      },
    });

    return NextResponse.json({ success: true, data: taxRate });
  } catch (error) {
    return handleApiError(error);
  }
}
