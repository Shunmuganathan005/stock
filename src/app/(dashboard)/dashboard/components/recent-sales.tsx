"use client";

import { t } from "@/lib/locales";
import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Loader2 } from "lucide-react";
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
    case "PAID":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t("enums.paymentStatuses.PAID")}
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

export function RecentSales() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "recent-sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales?pageSize=5");
      if (!res.ok) throw new Error("Failed to fetch recent sales");
      const json = await res.json();
      return json.data;
    },
  });

  const sales: Sale[] = data?.items ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t("dashboard.recentSales")}</CardTitle>
        <CardAction>
          <Link href="/sales" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
            {t("common.viewAll")}
            <ArrowRight data-icon="inline-end" className="size-4" />
          </Link>
        </CardAction>
      </CardHeader>
      <CardContent className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : sales.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("dashboard.noSalesYet")}
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
