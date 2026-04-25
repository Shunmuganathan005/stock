import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as taxRateService from "@/services/tax-rate.service";

export const PUT = withPermission(PERMISSIONS.SETTINGS_MANAGE, async (request, user) => {
  const url = new URL(request.url);
  const id = url.pathname.split('/').at(-1)!;
  const body = await request.json();
  const { name, percentage, isActive } = body;

  const taxRate = await taxRateService.updateTaxRate(
    id,
    {
      ...(name !== undefined && { name }),
      ...(percentage !== undefined && { percentage }),
      ...(isActive !== undefined && { isActive }),
    },
    user.organizationId
  );

  return NextResponse.json({ success: true, data: taxRate });
});
