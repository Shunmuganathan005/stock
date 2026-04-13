import { NextResponse } from "next/server";
import { requireAuth, handleApiError } from "@/lib/permissions";
import * as saleService from "@/services/sale.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const sale = await saleService.getSale(id);

    if (!sale) {
      return NextResponse.json(
        { success: false, error: "Sale not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: sale });
  } catch (error) {
    return handleApiError(error);
  }
}
