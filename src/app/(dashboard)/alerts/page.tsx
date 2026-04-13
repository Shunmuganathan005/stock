"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
} from "@/components/ui/card";
import { Bell, CheckCheck, ChevronLeft, ChevronRight, ExternalLink } from "lucide-react";

type AlertFilter = "ALL" | "UNREAD" | "READ";

interface Alert {
  id: string;
  productId: string;
  type: "LOW_STOCK" | "OUT_OF_STOCK";
  message: string;
  isRead: boolean;
  createdAt: string;
  product: {
    id: string;
    name: string;
  };
}

interface PaginatedAlerts {
  items: Alert[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AlertsPage() {
  const queryClient = useQueryClient();

  const [filter, setFilter] = useState<AlertFilter>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading, isError } = useQuery<PaginatedAlerts>({
    queryKey: ["alerts", { filter, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "10",
      });
      if (filter === "UNREAD") params.set("isRead", "false");
      if (filter === "READ") params.set("isRead", "true");

      const res = await fetch(`/api/alerts?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/alerts/${id}/read`, { method: "PUT" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-alerts-count"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("alerts.failedToMarkRead"));
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/alerts/mark-all-read", { method: "PUT" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("alerts.allMarkedRead"));
      queryClient.invalidateQueries({ queryKey: ["alerts"] });
      queryClient.invalidateQueries({ queryKey: ["unread-alerts-count"] });
    },
    onError: (error: Error) => {
      toast.error(error.message || t("alerts.failedToMarkAllRead"));
    },
  });

  function handleAlertClick(alert: Alert) {
    if (!alert.isRead) {
      markReadMutation.mutate(alert.id);
    }
  }

  function getAlertTypeBadge(type: Alert["type"]) {
    if (type === "OUT_OF_STOCK") {
      return (
        <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {t("alerts.types.outOfStock")}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
        {t("alerts.types.lowStock")}
      </span>
    );
  }

  function formatTimestamp(dateStr: string) {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const filterButtons: { label: string; value: AlertFilter }[] = [
    { label: t("alerts.filters.all"), value: "ALL" },
    { label: t("alerts.filters.unread"), value: "UNREAD" },
    { label: t("alerts.filters.read"), value: "READ" },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("alerts.title")}
        description={t("alerts.description")}
      >
        <Button
          variant="outline"
          onClick={() => markAllReadMutation.mutate()}
          disabled={markAllReadMutation.isPending}
        >
          <CheckCheck className="size-4" />
          {markAllReadMutation.isPending ? t("alerts.marking") : t("alerts.markAllRead")}
        </Button>
      </PageHeader>

      {/* Filter tabs */}
      <div className="flex items-center gap-1 rounded-lg border p-1 w-fit">
        {filterButtons.map((btn) => (
          <Button
            key={btn.value}
            variant={filter === btn.value ? "secondary" : "ghost"}
            size="sm"
            onClick={() => {
              setFilter(btn.value);
              setPage(1);
            }}
          >
            {btn.label}
          </Button>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("alerts.loadingAlerts")}
        </div>
      )}

      {/* Error state */}
      {isError && (
        <div className="flex justify-center py-12 text-destructive">
          {t("alerts.failedToLoadAlerts")}
        </div>
      )}

      {/* Alert list */}
      {data && (
        <>
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Bell className="size-10 mb-3 opacity-40" />
              <p>{t("alerts.noAlertsFound")}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.items.map((alert) => (
                <Card
                  key={alert.id}
                  className={`cursor-pointer transition-colors ${
                    !alert.isRead
                      ? "bg-primary/[0.03] ring-primary/20 dark:bg-primary/[0.06]"
                      : ""
                  }`}
                  onClick={() => handleAlertClick(alert)}
                >
                  <CardContent>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          {!alert.isRead && (
                            <span className="size-2 rounded-full bg-primary shrink-0" />
                          )}
                          <Link
                            href={`/products/${alert.product.id}`}
                            className="font-medium hover:underline underline-offset-2"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {alert.product.name}
                            <ExternalLink className="inline size-3 ml-1 opacity-50" />
                          </Link>
                          {getAlertTypeBadge(alert.type)}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {alert.message}
                        </p>
                        <p className="text-xs text-muted-foreground/70">
                          {formatTimestamp(alert.createdAt)}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Pagination */}
          {data.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                {t("common.paginationTotalShort", { page: data.page, totalPages: data.totalPages, total: data.total })}
              </p>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="size-4" />
                  {t("common.previous")}
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  {t("common.next")}
                  <ChevronRight className="size-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
