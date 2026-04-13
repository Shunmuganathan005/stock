import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as categoryService from "@/services/category.service";

export async function GET() {
  try {
    await requireAuth();

    const categories = await categoryService.listCategories();

    return NextResponse.json({ success: true, data: categories });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.PRODUCTS_CREATE);

    const body = await request.json();
    const { name, description } = body;

    if (!name || typeof name !== "string") {
      return NextResponse.json(
        { success: false, error: "Name is required" },
        { status: 400 }
      );
    }

    const category = await categoryService.createCategory({
      name,
      description: description || "",
    });

    return NextResponse.json({ success: true, data: category }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
