import { NextResponse } from "next/server";
import { withSession, withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { updateProductSchema } from "@/lib/validations/product";
import * as productService from "@/services/product.service";

export const GET = withSession(async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  const product = await productService.getProduct(id, user.organizationId);

  if (!product) {
    return NextResponse.json(
      { success: false, error: "Product not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: product });
});

export const PUT = withPermission(PERMISSIONS.PRODUCTS_EDIT, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  const body = await request.json();
  const data = updateProductSchema.parse(body);

  const { categoryId, taxRateId, ...rest } = data;
  const updateData: import("@prisma/client").Prisma.ProductUpdateInput = { ...rest };
  if (categoryId) {
    updateData.category = { connect: { id: categoryId } };
  }
  if (taxRateId) {
    updateData.taxRate = { connect: { id: taxRateId } };
  }
  const product = await productService.updateProduct(id, updateData, user.organizationId);

  return NextResponse.json({ success: true, data: product });
});

export const DELETE = withPermission(PERMISSIONS.PRODUCTS_DELETE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  await productService.deleteProduct(id, user.organizationId);

  return NextResponse.json({ success: true, message: "Product deleted" });
});
