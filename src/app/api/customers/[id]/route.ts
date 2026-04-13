import { NextResponse } from "next/server";
import { requirePermission, requireAuth, handleApiError } from "@/lib/permissions";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { updateCustomerSchema } from "@/lib/validations/customer";
import * as customerService from "@/services/customer.service";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth();

    const { id } = await params;
    const customer = await customerService.getCustomer(id);

    if (!customer) {
      return NextResponse.json(
        { success: false, error: "Customer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_EDIT);

    const { id } = await params;
    const body = await request.json();
    const data = updateCustomerSchema.parse(body);

    const customer = await customerService.updateCustomer(id, data);

    return NextResponse.json({ success: true, data: customer });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requirePermission(PERMISSIONS.CUSTOMERS_DELETE);

    const { id } = await params;
    await customerService.deleteCustomer(id);

    return NextResponse.json({ success: true, message: "Customer deleted" });
  } catch (error) {
    return handleApiError(error);
  }
}
