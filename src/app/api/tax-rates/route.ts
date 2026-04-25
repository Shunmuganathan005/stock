import { NextResponse } from "next/server";
import { withSession, withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as taxRateService from "@/services/tax-rate.service";

export const GET = withSession(async (request, user) => {
  const taxRates = await taxRateService.listTaxRates(user.organizationId);

  return NextResponse.json({ success: true, data: taxRates });
});

export const POST = withPermission(PERMISSIONS.SETTINGS_MANAGE, async (request, user) => {
  const body = await request.json();
  const { name, percentage } = body;

  if (!name || typeof name !== "string") {
    throw new Error("Name is required");
  }

  if (typeof percentage !== "number" || percentage < 0) {
    throw new Error("Valid percentage is required");
  }

  const taxRate = await taxRateService.createTaxRate(
    { name, percentage },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: taxRate }, { status: 201 });
});
