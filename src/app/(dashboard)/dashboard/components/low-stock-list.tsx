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

function getAlertTypeBadge(type: string) {
  switch (type) {
    case "OUT_OF_STOCK":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {t("alerts.types.outOfStock")}
        </Badge>
      );
    case "LOW_STOCK":
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {t("alerts.types.lowStock")}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{type}</Badge>;
  }
}

interface Alert {
  id: string;
  type: string;
  message: string;
  productId: string;
  product: {
    id: string;
    name: string;
    stockQuantity: number;
    sku: string;
  };
  createdAt: string;
}

export function LowStockList() {
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", "low-stock"],
    queryFn: async () => {
      const res = await fetch("/api/alerts?isRead=false&pageSize=5");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const json = await res.json();
      return json.data;
    },
  });

  const alerts: Alert[] = data?.items ?? [];

  return (
    <Card className="flex flex-col">
      <CardHeader>
        <CardTitle>{t("dashboard.lowStockProducts")}</CardTitle>
        <CardAction>
          <Link href="/alerts" className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}>
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
        ) : alerts.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {t("dashboard.noLowStockAlerts")}
          </p>
        ) : (
          <div className="space-y-1">
            {alerts.map((alert) => (
              <div
                key={alert.id}
                className="flex items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50 cursor-pointer"
                onClick={() => router.push(`/products/${alert.productId}`)}
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {alert.product.name}
                    </span>
                    {getAlertTypeBadge(alert.type)}
                  </div>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {t("dashboard.skuPrefix")} {alert.product.sku}
                  </p>
                </div>
                <div className="ml-4 shrink-0 text-right">
                  <span className="text-sm font-semibold">
                    {alert.product.stockQuantity}
                  </span>
                  <p className="text-xs text-muted-foreground">{t("dashboard.inStock")}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
