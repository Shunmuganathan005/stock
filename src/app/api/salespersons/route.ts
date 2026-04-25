import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import * as salespersonService from "@/services/salesperson.service";

export const GET = withPermission("collections.view", async (_request, user) => {
  const result = await salespersonService.listSalespersons(user.organizationId);
  return NextResponse.json({ success: true, data: result });
});

const createSchema = z.object({
  name: z.string().min(1),
  phone: z.string().optional(),
});

export const POST = withPermission("collections.manage", async (request, user) => {
  const body = await request.json();
  const data = createSchema.parse(body);

  const salesperson = await salespersonService.createSalesperson(data, user.organizationId);

  return NextResponse.json({ success: true, data: salesperson }, { status: 201 });
});
