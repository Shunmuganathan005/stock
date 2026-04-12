import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/backend/auth/permissions";
import * as saleService from "@/backend/services/sale.service";

export async function GET() {
  try {
    await requireAuth();

    const nextNumber = await saleService.getNextSaleNumber();

    return NextResponse.json({ success: true, data: { saleNumber: nextNumber } });
  } catch (error) {
    return handleApiError(error);
  }
}
