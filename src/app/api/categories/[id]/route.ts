import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as categoryService from "@/services/category.service";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_EDIT);

    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const category = await categoryService.updateCategory(id, {
      name,
      description,
    });

    return NextResponse.json({ success: true, data: category });
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
    await categoryService.deleteCategory(id);

    return NextResponse.json({ success: true, message: "Category deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
