"use client";

import { t } from "@/lib/locales";
import { useQuery } from "@tanstack/react-query";
import { Package, AlertTriangle, ShoppingCart, IndianRupee } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  className?: string;
}

function StatCard({ title, value, icon, className }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        <div className={cn("size-5 shrink-0", className)}>{icon}</div>
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  // Fetch total products count
  const { data: productsData } = useQuery({
    queryKey: ["stats", "products"],
    queryFn: async () => {
      const res = await fetch("/api/products?pageSize=1");
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch low stock / unread alerts count
  const { data: alertsData } = useQuery({
    queryKey: ["stats", "alerts"],
    queryFn: async () => {
      const res = await fetch("/api/alerts/unread-count");
      if (!res.ok) throw new Error("Failed to fetch alerts");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch total sales count
  const { data: salesData } = useQuery({
    queryKey: ["stats", "sales"],
    queryFn: async () => {
      const res = await fetch("/api/sales?pageSize=1");
      if (!res.ok) throw new Error("Failed to fetch sales");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch unpaid sales count
  const { data: unpaidData } = useQuery({
    queryKey: ["stats", "unpaid"],
    queryFn: async () => {
      const res = await fetch("/api/sales?paymentStatus=UNPAID&pageSize=1");
      if (!res.ok) throw new Error("Failed to fetch unpaid sales");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch partial sales count
  const { data: partialData } = useQuery({
    queryKey: ["stats", "partial"],
    queryFn: async () => {
      const res = await fetch("/api/sales?paymentStatus=PARTIAL&pageSize=1");
      if (!res.ok) throw new Error("Failed to fetch partial sales");
      const json = await res.json();
      return json.data;
    },
  });

  const totalProducts = productsData?.total ?? 0;
  const lowStockCount = alertsData?.count ?? 0;
  const totalSales = salesData?.total ?? 0;
  const unpaidCount = (unpaidData?.total ?? 0) + (partialData?.total ?? 0);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title={t("dashboard.totalProducts")}
        value={totalProducts}
        icon={<Package className="size-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("dashboard.lowStockAlerts")}
        value={lowStockCount}
        icon={
          <AlertTriangle
            className={cn(
              "size-5",
              lowStockCount > 0
                ? "text-orange-500"
                : "text-muted-foreground"
            )}
          />
        }
      />
      <StatCard
        title={t("dashboard.totalSales")}
        value={totalSales}
        icon={<ShoppingCart className="size-5 text-muted-foreground" />}
      />
      <StatCard
        title={t("dashboard.unpaidPartialSales")}
        value={unpaidCount}
        icon={
          <IndianRupee
            className={cn(
              "size-5",
              unpaidCount > 0 ? "text-red-500" : "text-muted-foreground"
            )}
          />
        }
      />
    </div>
  );
}
