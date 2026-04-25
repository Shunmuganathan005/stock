import { NextResponse } from "next/server";
import { withSession, withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as categoryService from "@/services/category.service";

export const GET = withSession(async (request, user) => {
  const categories = await categoryService.listCategories(user.organizationId);

  return NextResponse.json({ success: true, data: categories });
});

export const POST = withPermission(PERMISSIONS.PRODUCTS_CREATE, async (request, user) => {
  const body = await request.json();
  const { name, description } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json(
      { success: false, error: "Name is required" },
      { status: 400 }
    );
  }

  const category = await categoryService.createCategory(
    { name, description: description || "" },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: category }, { status: 201 });
});
