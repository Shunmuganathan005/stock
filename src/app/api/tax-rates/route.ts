import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/backend/auth/permissions";
import { PERMISSIONS } from "@/shared/constants/permissions";
import { prisma } from "@/backend/db/prisma";

export async function GET() {
  try {
    await requireAuth();

    const taxRates = await prisma.taxRate.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });

    return NextResponse.json({ success: true, data: taxRates });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.SETTINGS_MANAGE);

    const body = await request.json();
    const { name, percentage } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    if (typeof percentage !== "number" || percentage < 0) {
      return NextResponse.json(
        { success: false, error: "Valid percentage is required" },
        { status: 400 }
      );
    }

    const taxRate = await prisma.taxRate.create({
      data: { name, percentage },
    });

    return NextResponse.json({ success: true, data: taxRate }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
