import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as saleService from "@/services/sale.service";

export const GET = withSession(async (_request, user) => {
  const nextNumber = await saleService.getNextSaleNumber(user.organizationId);

  return NextResponse.json({ success: true, data: { saleNumber: nextNumber } });
});
