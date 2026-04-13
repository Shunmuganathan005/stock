import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as saleService from "@/services/sale.service";

export async function GET() {
  try {
    await requireAuth();

    const nextNumber = await saleService.getNextSaleNumber();

    return NextResponse.json({ success: true, data: { saleNumber: nextNumber } });
  } catch (error) {
    return handleApiError(error);
  }
}
