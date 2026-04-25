import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as salespersonService from "@/services/salesperson.service";

export const GET = withPermission(PERMISSIONS.COLLECTIONS_VIEW, async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;

  try {
    const salesperson = await salespersonService.getSalesperson(id, user.organizationId);
    return NextResponse.json({ success: true, data: salesperson });
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

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  phone: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const PATCH = withPermission(PERMISSIONS.COLLECTIONS_MANAGE, async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;
  const body = await request.json();
  const data = updateSchema.parse(body);

  try {
    const salesperson = await salespersonService.updateSalesperson(id, data, user.organizationId);
    return NextResponse.json({ success: true, data: salesperson });
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

export const DELETE = withPermission(PERMISSIONS.COLLECTIONS_MANAGE, async (request, user) => {
  const id = new URL(request.url).pathname.split("/").at(-1)!;

  try {
    await salespersonService.deleteSalesperson(id, user.organizationId);
    return NextResponse.json({ success: true, message: "Salesperson deleted" });
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
