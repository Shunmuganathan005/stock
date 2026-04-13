import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createSaleSchema } from "@/lib/validations/sale";
import * as saleService from "@/services/sale.service";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.SALES_VIEW);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const customerId = searchParams.get("customerId") || undefined;
    const paymentStatus = searchParams.get("paymentStatus") || undefined;

    const result = await saleService.listSales({
      page,
      pageSize,
      search,
      customerId,
      paymentStatus: paymentStatus as import("@prisma/client").PaymentStatus | undefined,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.SALES_CREATE);

    const body = await request.json();
    const data = createSaleSchema.parse(body);

    const sale = await saleService.createSale(data, user.id);

    return NextResponse.json({ success: true, data: sale }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
