import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as collectionService from "@/services/collection.service";

const updateCollectionSchema = z.object({
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
    const id = new URL(request.url).pathname.split("/").at(-1)!;

    try {
      const collection = await collectionService.getCollection(id, user.organizationId);
      return NextResponse.json({ success: true, data: collection });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      if (message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "Collection not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  }
);

export const PUT = withPermission(
  PERMISSIONS.COLLECTIONS_CREATE,
  async (request, user) => {
    const id = new URL(request.url).pathname.split("/").at(-1)!;

    const body = await request.json();
    const parsed = updateCollectionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message ?? "Validation error" },
        { status: 422 }
      );
    }

    try {
      const collection = await collectionService.updateCollection(
        id,
        { items: parsed.data.items },
        user.organizationId
      );
      return NextResponse.json({ success: true, data: collection });
    } catch (error) {
      const message = error instanceof Error ? error.message : "An error occurred";
      if (message.toLowerCase() === "collection not found" || message.toLowerCase().includes("salesperson not found")) {
        return NextResponse.json({ success: false, error: message }, { status: 404 });
      }
      if (message.toLowerCase().includes("not found") || message.toLowerCase().includes("at least one item")) {
        return NextResponse.json({ success: false, error: message }, { status: 422 });
      }
      throw error;
    }
  }
);

export const DELETE = withPermission(
  PERMISSIONS.COLLECTIONS_CREATE,
  async (request, user) => {
    const id = new URL(request.url).pathname.split("/").at(-1)!;

    try {
      await collectionService.deleteCollection(id, user.organizationId);
      return NextResponse.json({ success: true, message: "Collection deleted" });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Internal server error";
      if (message.includes("not found")) {
        return NextResponse.json(
          { success: false, error: "Collection not found" },
          { status: 404 }
        );
      }
      throw error;
    }
  }
);
