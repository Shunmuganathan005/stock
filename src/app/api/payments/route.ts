import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { createPaymentSchema } from "@/lib/validations/sale";
import * as paymentService from "@/services/payment.service";

export const POST = withPermission(PERMISSIONS.PAYMENTS_RECORD, async (request, user) => {
  const body = await request.json();
  const data = createPaymentSchema.parse(body);

  const payment = await paymentService.recordPayment(data, user.id, user.organizationId);

  return NextResponse.json({ success: true, data: payment }, { status: 201 });
});
