import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createCustomerSchema } from "@/lib/validations/customer";
import * as customerService from "@/services/customer.service";

export const GET = withPermission(PERMISSIONS.CUSTOMERS_VIEW, async (request, user) => {
  const { searchParams } = new URL(request.url);
  const page = parseInt(searchParams.get("page") || "1");
  const pageSize = parseInt(searchParams.get("pageSize") || "20");
  const search = searchParams.get("search") || "";

  const result = await customerService.listCustomers(
    { page, pageSize, search },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: result });
});

export const POST = withPermission(PERMISSIONS.CUSTOMERS_CREATE, async (request, user) => {
  const body = await request.json();
  const data = createCustomerSchema.parse(body);

  const customer = await customerService.createCustomer(
    { ...data, gstin: data.gstin ?? undefined },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: customer }, { status: 201 });
});
