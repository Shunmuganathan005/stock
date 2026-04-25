import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as placeService from "@/services/place.service";

export const GET = withPermission("collections.view", async (_request, user) => {
  const result = await placeService.listPlaces(user.organizationId);
  return NextResponse.json({ success: true, data: result });
});

const createSchema = z.object({
  name: z.string().min(1),
});

export const POST = withPermission("collections.manage", async (request, user) => {
  const body = await request.json();
  const data = createSchema.parse(body);

  const place = await placeService.createPlace({ name: data.name }, user.organizationId);

  return NextResponse.json({ success: true, data: place }, { status: 201 });
});
