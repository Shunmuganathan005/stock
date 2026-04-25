import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as vendorService from "@/services/vendor.service";

export const GET = withPermission(PERMISSIONS.COLLECTIONS_VIEW, async (request, user) => {
  const { searchParams } = new URL(request.url);
  const placeId = searchParams.get("placeId") ?? undefined;

  const result = await vendorService.listVendors({ placeId }, user.organizationId);
  return NextResponse.json({ success: true, data: result });
});

const createSchema = z.object({
  name: z.string().min(1),
  placeId: z.string().min(1),
});

export const POST = withPermission(PERMISSIONS.COLLECTIONS_MANAGE, async (request, user) => {
  const body = await request.json();
  const data = createSchema.parse(body);

  try {
    const vendor = await vendorService.createVendor(
      { name: data.name, placeId: data.placeId },
      user.organizationId
    );

    return NextResponse.json({ success: true, data: vendor }, { status: 201 });
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
