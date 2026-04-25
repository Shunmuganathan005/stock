import { NextResponse } from "next/server";
import { withSession, withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { updateCustomerSchema } from "@/lib/validations/customer";
import * as customerService from "@/services/customer.service";

export const GET = withSession(async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  const customer = await customerService.getCustomer(id, user.organizationId);

  if (!customer) {
    return NextResponse.json(
      { success: false, error: "Customer not found" },
      { status: 404 }
    );
  }

  return NextResponse.json({ success: true, data: customer });
});

export const PUT = withPermission(PERMISSIONS.CUSTOMERS_EDIT, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  const body = await request.json();
  const data = updateCustomerSchema.parse(body);

  const customer = await customerService.updateCustomer(id, data, user.organizationId);

  return NextResponse.json({ success: true, data: customer });
});

export const DELETE = withPermission(PERMISSIONS.CUSTOMERS_DELETE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split("/").at(-1)!;

  await customerService.deleteCustomer(id, user.organizationId);

  return NextResponse.json({ success: true, message: "Customer deleted" });
});
