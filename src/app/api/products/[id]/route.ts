import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/backend/auth/permissions";
import { PERMISSIONS } from "@/shared/constants/permissions";
import { updateProductSchema } from "@/shared/validations/product";
import * as productService from "@/backend/services/product.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const product = await productService.getProduct(id);

    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_EDIT);

    const { id } = await params;
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
    const product = await productService.updateProduct(id, updateData);

    return NextResponse.json({ success: true, data: product });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_DELETE);

    const { id } = await params;
    await productService.deleteProduct(id);

    return NextResponse.json({ success: true, message: "Product deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
