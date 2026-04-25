import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as collectionService from "@/services/collection.service";

const createCollectionSchema = z.object({
  date: z.string().min(1),
  salespersonId: z.string().min(1),
  items: z
    .array(
      z.object({
        vendorId: z.string().min(1),
        productId: z.string().min(1),
        quantity: z.number().positive(),
        rate: z.number().positive(),
      })
    )
    .min(1, "At least one item is required"),
});

export const GET = withPermission(
  PERMISSIONS.COLLECTIONS_VIEW,
  async (request, user) => {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date") || undefined;
    const salespersonId = searchParams.get("salespersonId") || undefined;
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");

    let date: Date | undefined;
    if (dateParam) {
      date = new Date(dateParam);
      if (isNaN(date.getTime())) {
        return NextResponse.json(
          { success: false, error: "Invalid date" },
          { status: 400 }
        );
      }
    }

    const result = await collectionService.listCollections(
      { date, salespersonId, page, pageSize },
      user.organizationId
    );

    return NextResponse.json({ success: true, data: result });
  }
);

export const POST = withPermission(
  PERMISSIONS.COLLECTIONS_CREATE,
  async (request, user) => {
    const body = await request.json();
    const parsed = createCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" },
        { status: 422 }
      );
    }

    const { date: dateStr, salespersonId, items } = parsed.data;
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date" },
        { status: 400 }
      );
    }

    try {
      const collection = await collectionService.createCollection(
        { date, salespersonId, items },
        user.organizationId
      );
      return NextResponse.json({ success: true, data: collection }, { status: 201 });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (message.toLowerCase().includes("already exists")) {
        return NextResponse.json({ success: false, error: message }, { status: 409 });
      }
      if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("at least one item")) {
        return NextResponse.json({ success: false, error: message }, { status: 422 });
      }
      throw error;
    }
  }
);
