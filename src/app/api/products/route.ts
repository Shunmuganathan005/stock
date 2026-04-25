import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProductSchema } from "@/lib/validations/product";
import * as productService from "@/services/product.service";

export const GET = withPermission(PERMISSIONS.PRODUCTS_VIEW, async (request, user) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";
  const categoryId = searchParams.get("categoryId") || undefined;

  const result = await productService.listProducts(
    { page, pageSize, search, categoryId },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: result });
});

export const POST = withPermission(PERMISSIONS.PRODUCTS_CREATE, async (request, user) => {
  const body = await request.json();
  const data = createProductSchema.parse(body);

  const product = await productService.createProduct(
    { ...data, barcode: data.barcode ?? undefined },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: product }, { status: 201 });
});
