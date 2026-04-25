import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as collectionService from "@/services/collection.service";

export const GET = withPermission(
  PERMISSIONS.COLLECTIONS_VIEW,
  async (request, user) => {
    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get("date");

    if (!dateParam) {
      return NextResponse.json(
        { success: false, error: "date query parameter is required" },
        { status: 400 }
      );
    }

    const date = new Date(dateParam);
    if (isNaN(date.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid date" },
        { status: 400 }
      );
    }

    const result = await collectionService.getSummary(date, user.organizationId);

    return NextResponse.json({ success: true, data: result });
  }
);
