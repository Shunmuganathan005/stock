import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as categoryService from "@/services/category.service";

export const PUT = withPermission(PERMISSIONS.PRODUCTS_EDIT, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;
  const body = await request.json();
  const { name, description } = body;

  const category = await categoryService.updateCategory(
    id,
    { name, description },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: category });
});

export const DELETE = withPermission(PERMISSIONS.PRODUCTS_DELETE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;

  await categoryService.deleteCategory(id, user.organizationId);

  return NextResponse.json({ success: true, message: "Category deleted" });
});
