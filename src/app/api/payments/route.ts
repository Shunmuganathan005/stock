import { NextResponse } from "next/server";
import { requirePermission, handleApiError } from "@/backend/auth/permissions";
import { PERMISSIONS } from "@/shared/constants/permissions";
import { createPaymentSchema } from "@/shared/validations/sale";
import * as paymentService from "@/backend/services/payment.service";

export async function POST(request: Request) {
  try {
    const user = await requirePermission(PERMISSIONS.PAYMENTS_RECORD);

    const body = await request.json();
    const data = createPaymentSchema.parse(body);

    const payment = await paymentService.recordPayment(data, user.id);

    return NextResponse.json({ success: true, data: payment }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
