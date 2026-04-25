import { NextResponse } from "next/server";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import * as collectionService from "@/services/collection.service";

export const GET = withPermission(
  PERMISSIONS.COLLECTIONS_VIEW,
  async (request, user) => {
    const { searchParams } = new URL(request.url);
    const startDateParam = searchParams.get("startDate");
    const scope = searchParams.get("scope") as "all" | "salesperson" | "vendor" | null;
    const salespersonId = searchParams.get("salespersonId") || undefined;
    const vendorId = searchParams.get("vendorId") || undefined;

    if (!startDateParam) {
      return NextResponse.json(
        { success: false, error: "startDate query parameter is required" },
        { status: 400 }
      );
    }

    const startDate = new Date(startDateParam);
    if (isNaN(startDate.getTime())) {
      return NextResponse.json(
        { success: false, error: "Invalid startDate" },
        { status: 400 }
      );
    }

    if (!scope || !["all", "salesperson", "vendor"].includes(scope)) {
      return NextResponse.json(
        { success: false, error: "scope must be one of: all, salesperson, vendor" },
        { status: 400 }
      );
    }

    if (scope === "salesperson" && !salespersonId) {
      return NextResponse.json(
        { success: false, error: "salespersonId is required when scope is salesperson" },
        { status: 400 }
      );
    }

    if (scope === "vendor" && !vendorId) {
      return NextResponse.json(
        { success: false, error: "vendorId is required when scope is vendor" },
        { status: 400 }
      );
    }

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 6);

    const exportParams: {
      startDate: Date;
      endDate: Date;
      salespersonId?: string;
      vendorId?: string;
    } = { startDate, endDate };

    if (scope === "salesperson") {
      exportParams.salespersonId = salespersonId;
    } else if (scope === "vendor") {
      exportParams.vendorId = vendorId;
    }

    const items = await collectionService.getExportData(exportParams, user.organizationId);

    const escape = (val: string) => `"${val.replace(/"/g, '""')}"`;

    const headers = ["Date", "Salesperson", "Place", "Vendor", "Product", "Quantity", "Rate", "Amount"];
    const rows = items.map((item) => [
      escape(item.collection.date.toISOString().split("T")[0]),
      escape(item.collection.salesperson.name),
      escape(item.vendor.place.name),
      escape(item.vendor.name),
      escape(item.product.name),
      item.quantity.toString(),
      item.rate.toString(),
      item.amount.toString(),
    ]);

    const normalizedStartDate = startDate.toISOString().split("T")[0];
    const csvContent = [headers, ...rows].map((r) => r.join(",")).join("\r\n");

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="collections-export-${normalizedStartDate}.csv"`,
      },
    });
  }
);
