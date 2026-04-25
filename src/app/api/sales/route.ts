import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createSaleSchema } from "@/lib/validations/sale";
import * as saleService from "@/services/sale.service";

export const GET = withPermission(PERMISSIONS.SALES_VIEW, async (request, user) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const customerId = searchParams.get("customerId") || undefined;
  const paymentStatus = searchParams.get("paymentStatus") || undefined;

  const result = await saleService.listSales(
    {
      page,
      pageSize,
      search,
      customerId,
      paymentStatus: paymentStatus as import("@prisma/client").PaymentStatus | undefined,
    },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: result });
});

export const POST = withPermission(PERMISSIONS.SALES_CREATE, async (request, user) => {
  const body = await request.json();
  const data = createSaleSchema.parse(body);

  const sale = await saleService.createSale(data, user.id, user.organizationId);

  return NextResponse.json({ success: true, data: sale }, { status: 201 });
});
