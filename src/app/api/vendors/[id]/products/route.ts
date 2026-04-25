import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as vendorService from "@/services/vendor.service";

export const GET = withPermission(PERMISSIONS.COLLECTIONS_VIEW, async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-2)!;

  try {
    const vendor = await vendorService.getVendor(id, user.organizationId);
    return NextResponse.json({ success: true, data: vendor.products });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("cannot delete")) {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    if (message.toLowerCase().includes("invalid or do not belong")) {
      return NextResponse.json({ success: false, error: message }, { status: 422 });
    }
    throw error;
  }
});

const setProductsSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string().min(1),
      rate: z.number().positive(),
    })
  ),
});

export const PUT = withPermission(PERMISSIONS.COLLECTIONS_MANAGE, async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-2)!;
  const body = await request.json();
  const { items } = setProductsSchema.parse(body);

  try {
    const result = await vendorService.setVendorProducts(id, items, user.organizationId);
    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "An error occurred";
    if (message.toLowerCase().includes("not found")) {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (message.toLowerCase().includes("already exists") || message.toLowerCase().includes("cannot delete")) {
      return NextResponse.json({ success: false, error: message }, { status: 409 });
    }
    if (message.toLowerCase().includes("invalid or do not belong")) {
      return NextResponse.json({ success: false, error: message }, { status: 422 });
    }
    throw error;
  }
});
