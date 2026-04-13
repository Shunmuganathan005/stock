import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createProductSchema } from "@/lib/validations/product";
import * as productService from "@/services/product.service";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_VIEW);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("categoryId") || undefined;

    const result = await productService.listProducts({
      page,
      pageSize,
      search,
      categoryId,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_CREATE);

    const body = await request.json();
    const data = createProductSchema.parse(body);

    const { categoryId, taxRateId, ...rest } = data;
    const product = await productService.createProduct({
      ...rest,
      category: { connect: { id: categoryId } },
      taxRate: { connect: { id: taxRateId } },
    });

    return NextResponse.json({ success: true, data: product }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
