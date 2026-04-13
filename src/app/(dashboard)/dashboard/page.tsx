"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
import { t } from "@/lib/locales";
import { PageHeader } from "@/components/layout/page-header";
import { StatsCards } from "@/app/(dashboard)/dashboard/components/stats-cards";
import { RecentSales } from "@/app/(dashboard)/dashboard/components/recent-sales";
import { LowStockList } from "@/app/(dashboard)/dashboard/components/low-stock-list";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

function getStatusBadge(status: string) {
  switch (status) {
    case "UNPAID":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {t("enums.paymentStatuses.UNPAID")}
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {t("enums.paymentStatuses.PARTIAL")}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

interface Sale {
  id: string;
  saleNumber: string;
  customer: { name: string; businessName?: string };
  grandTotal: number;
  paymentStatus: string;
  createdAt: string;
}

function UnpaidSales() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "unpaid-sales"],
    queryFn: async () => {
      const [unpaidRes, partialRes] = await Promise.all([
        fetch("/api/sales?paymentStatus=UNPAID&pageSize=5"),
        fetch("/api/sales?paymentStatus=PARTIAL&pageSize=5"),
      ]);
      if (!unpaidRes.ok || !partialRes.ok)
        throw new Error("Failed to fetch unpaid sales");
      const [unpaidJson, partialJson] = await Promise.all([
        unpaidRes.json(),
        partialRes.json(),
      ]);

      const combined: Sale[] = [
        ...(unpaidJson.data?.items ?? []),
        ...(partialJson.data?.items ?? []),
      ];

      // Sort by date descending and take the first 5
      combined.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );

      return combined.slice(0, 5);
    },
  });

  const sales: Sale[] = data ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("dashboard.unpaidSales")}</CardTitle>
        <CardAction>
          <Link href="/sales" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            {t("common.viewAll")}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("dashboard.allSalesPaid")}
          </p>
        ) : (
          <div className="space-y-1">
            {sales.map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/sales/${sale.id}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {sale.saleNumber}
                    </span>
                    {getStatusBadge(sale.paymentStatus)}
                  </div>
                  <p className="mt-0.5 truncate text-xs text-muted-foreground">
                    {sale.customer.businessName || sale.customer.name}
                    {" \u00B7 "}
                    {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <span className="ml-4 shrink-0 text-sm font-semibold">
                  {formatCurrency(sale.grandTotal)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("dashboard.title")}
        description={t("dashboard.description")}
      />

      {/* Stats Cards Row */}
      <StatsCards />

      {/* Two-column layout: Recent Sales (left) and Low Stock (right) */}
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentSales />
        <LowStockList />
      </div>

      {/* Unpaid Sales Section */}
      <UnpaidSales />
    </div>
  );
}
