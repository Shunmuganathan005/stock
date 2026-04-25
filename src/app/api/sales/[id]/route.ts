import { NextResponse } from "next/server";
import { withSession } from "@/lib/auth";
import * as saleService from "@/services/sale.service";

export const GET = withSession(async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  const sale = await saleService.getSale(id, user.organizationId);

  if (!sale) {
    return NextResponse.json(
      { success: false, error: "Sale not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: sale });
});
