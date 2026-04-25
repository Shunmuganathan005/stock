"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { ChevronDown, ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { t } from "@/lib/locales";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface SummaryRow {
  salespersonId: string;
  salespersonName: string;
  placeId: string;
  placeName: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

interface ProductLeaf {
  productId: string;
  productName: string;
  totalQuantity: number;
  totalAmount: number;
}

interface PlaceVendorGroup {
  placeId: string;
  placeName: string;
  vendorId: string;
  vendorName: string;
  products: ProductLeaf[];
}

interface SalespersonGroup {
  salespersonId: string;
  salespersonName: string;
  totalQuantity: number;
  totalAmount: number;
  placeVendorGroups: PlaceVendorGroup[];
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

export default function CollectionSummaryPage() {
  const router = useRouter();
  const { hasPermission, isLoading: permLoading } = usePermissions();
  const [date, setDate] = useState(todayStr());
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  // Query — called unconditionally to satisfy Rules of Hooks
  const { data: rows = [], isLoading } = useQuery<SummaryRow[]>({
    queryKey: ["collections-summary", date],
    queryFn: async () => {
      const params = new URLSearchParams({ date });
      const res = await fetch(`/api/collections/summary?${params}`);
      if (!res.ok) throw new Error("Failed to fetch summary");
      const json = await res.json();
      return json.data ?? [];
    },
    enabled: !!date,
  });

  const grouped = useMemo<SalespersonGroup[]>(() => {
    const map = new Map<string, SalespersonGroup>();

    for (const row of rows) {
      if (!map.has(row.salespersonId)) {
        map.set(row.salespersonId, {
          salespersonId: row.salespersonId,
          salespersonName: row.salespersonName,
          totalQuantity: 0,
          totalAmount: 0,
          placeVendorGroups: [],
        });
      }
      const sp = map.get(row.salespersonId)!;
      sp.totalQuantity += row.totalQuantity;
      sp.totalAmount += row.totalAmount;

      const pvKey = `${row.placeId}::${row.vendorId}`;
      let pv = sp.placeVendorGroups.find(
        (g) => g.placeId === row.placeId && g.vendorId === row.vendorId
      );
      if (!pv) {
        pv = {
          placeId: row.placeId,
          placeName: row.placeName,
          vendorId: row.vendorId,
          vendorName: row.vendorName,
          products: [],
        };
        sp.placeVendorGroups.push(pv);
      }
      pv.products.push({
        productId: row.productId,
        productName: row.productName,
        totalQuantity: row.totalQuantity,
        totalAmount: row.totalAmount,
      });
    }

    return Array.from(map.values());
  }, [rows]);

  const grandTotalQty = useMemo(
    () => grouped.reduce((sum, sp) => sum + sp.totalQuantity, 0),
    [grouped]
  );
  const grandTotalAmount = useMemo(
    () => grouped.reduce((sum, sp) => sum + sp.totalAmount, 0),
    [grouped]
  );

  // Permission redirect via useEffect — safe, does not affect hook order
  useEffect(() => {
    if (!permLoading && !hasPermission("collections.view")) {
      router.replace("/dashboard");
    }
  }, [permLoading, hasPermission, router]);

  function toggleExpanded(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  // Guard render — safe to return early after all hooks are called
  if (!permLoading && !hasPermission("collections.view")) return null;

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t("summary.title")}
        description={t("summary.date") + ": " + date}
      />

      {/* Date picker */}
      <div className="flex items-end gap-4">
        <div className="space-y-1">
          <Label htmlFor="summary-date">{t("summary.date")}</Label>
          <Input
            id="summary-date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-44"
          />
        </div>
      </div>

      {/* Content */}
      {isLoading || permLoading ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("collections.loading")}
        </div>
      ) : grouped.length === 0 ? (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("summary.noData")}
        </div>
      ) : (
        <div className="space-y-2">
          {grouped.map((sp) => {
            const isOpen = expanded.has(sp.salespersonId);
            return (
              <div
                key={sp.salespersonId}
                className="rounded-lg border bg-card"
              >
                {/* Salesperson header row */}
                <button
                  type="button"
                  onClick={() => toggleExpanded(sp.salespersonId)}
                  className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-muted/50 transition-colors rounded-lg"
                >
                  <div className="flex items-center gap-2">
                    {isOpen ? (
                      <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">
                      {sp.salespersonName}
                    </span>
                  </div>
                  <div className="flex items-center gap-6 text-sm text-muted-foreground">
                    <span>
                      {t("summary.qty")}: {sp.totalQuantity}
                    </span>
                    <span className="font-medium text-foreground">
                      {t("summary.amount")}: {formatCurrency(sp.totalAmount)}
                    </span>
                  </div>
                </button>

                {/* Expanded place/vendor/product rows */}
                {isOpen && (
                  <div className="border-t px-4 pb-3">
                    {sp.placeVendorGroups.map((pv) => (
                      <div
                        key={`${pv.placeId}-${pv.vendorId}`}
                        className="mt-3"
                      >
                        <div className="mb-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          {pv.placeName} · {pv.vendorName}
                        </div>
                        <div className="space-y-1 pl-3">
                          {pv.products.map((product) => {
                            const unitPrice =
                              product.totalQuantity > 0
                                ? product.totalAmount / product.totalQuantity
                                : 0;
                            return (
                              <div
                                key={product.productId}
                                className="flex items-center justify-between text-sm py-0.5"
                              >
                                <span className="text-foreground">
                                  {product.productName}
                                </span>
                                <span className="text-muted-foreground tabular-nums">
                                  {product.totalQuantity} &times;{" "}
                                  {formatCurrency(unitPrice)} ={" "}
                                  <span className="font-medium text-foreground">
                                    {formatCurrency(product.totalAmount)}
                                  </span>
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {/* Grand total */}
          <div className="rounded-lg border border-border bg-muted/50 px-4 py-3 flex items-center justify-between">
            <span className="font-semibold text-sm">{t("summary.grandTotal")}</span>
            <div className="flex items-center gap-6 text-sm">
              <span className="text-muted-foreground">
                {t("summary.qty")}: {grandTotalQty}
              </span>
              <span className="font-semibold text-foreground">
                {t("summary.amount")}: {formatCurrency(grandTotalAmount)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
