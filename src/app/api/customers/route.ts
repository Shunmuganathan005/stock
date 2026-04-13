import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createCustomerSchema } from "@/lib/validations/customer";
import * as customerService from "@/services/customer.service";

export async function GET(request: Request) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_VIEW);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const pageSize = parseInt(searchParams.get("pageSize") || "20");
    const search = searchParams.get("search") || "";

    const result = await customerService.listCustomers({
      page,
      pageSize,
      search,
    });

    return NextResponse.json({ success: true, data: result });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: Request) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_CREATE);

    const body = await request.json();
    const data = createCustomerSchema.parse(body);

    const customer = await customerService.createCustomer(data);

    return NextResponse.json({ success: true, data: customer }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
