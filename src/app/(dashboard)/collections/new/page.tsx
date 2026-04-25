"use client";

import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

interface Salesperson {
  id: string;
  name: string;
}

interface VendorProduct {
  place: { id: string; name: string };
  vendor: { id: string; name: string };
  products: {
    productId: string;
    rate: number;
    product: { id: string; name: string; unit: string };
  }[];
}

interface LineItem {
  placeId: string;
  placeName: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  unit: string;
  rate: number;
  quantity: number;
  amount: number;
}

export default function NewCollectionPage() {
  const router = useRouter();

  const [date, setDate] = useState(todayStr());
  const [salespersonId, setSalespersonId] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  // removedItems: keyed by placeId, stores removed LineItem[]
  const [removedItems, setRemovedItems] = useState<Record<string, LineItem[]>>({});

  const { data: salespersons = [], isLoading: salespersonsLoading } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: async () => {
      const res = await fetch("/api/salespersons");
      if (!res.ok) throw new Error("Failed to fetch salespersons");
      const json = await res.json();
      return json.data ?? [];
    },
  });

  const vendorProductsQuery = useQuery<VendorProduct[]>({
    queryKey: ["salesperson-vendor-products", salespersonId],
    queryFn: async () => {
      const res = await fetch(`/api/salespersons/${salespersonId}/vendor-products`);
      if (!res.ok) throw new Error("Failed to fetch vendor products");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data ?? [];
    },
    enabled: !!salespersonId,
  });

  const vendorProductsLoading = vendorProductsQuery.isLoading;

  // Populate line items when data loads (NOT inside queryFn)
  useEffect(() => {
    if (!vendorProductsQuery.data) return;
    const items: LineItem[] = vendorProductsQuery.data.flatMap(
      (group) =>
        group.products.map((p) => ({
          placeId: group.place.id,
          placeName: group.place.name,
          vendorId: group.vendor.id,
          vendorName: group.vendor.name,
          productId: p.productId,
          productName: p.product.name,
          unit: p.product.unit,
          rate: p.rate,
          quantity: 0,
          amount: 0,
        }))
    );
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLineItems(items);
    setRemovedItems({});
  }, [vendorProductsQuery.data]);

  const createMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      salespersonId: string;
      items: { vendorId: string; productId: string; quantity: number; rate: number }[];
    }) => {
      const res = await fetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to save collection");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(t("collections.savedSuccess"));
      router.push(`/collections/${data.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleSalespersonChange(val: string) {
    if (!val) return;
    setSalespersonId(val);
    setLineItems([]);
    setRemovedItems({});
  }

  function updateItem(
    placeId: string,
    vendorId: string,
    productId: string,
    field: "rate" | "quantity",
    value: number
  ) {
    setLineItems((prev) =>
      prev.map((item) => {
        if (
          item.placeId === placeId &&
          item.vendorId === vendorId &&
          item.productId === productId
        ) {
          const updated = { ...item, [field]: value };
          updated.amount = updated.quantity * updated.rate;
          return updated;
        }
        return item;
      })
    );
  }

  function removeItem(item: LineItem) {
    setLineItems((prev) =>
      prev.filter(
        (li) =>
          !(
            li.placeId === item.placeId &&
            li.vendorId === item.vendorId &&
            li.productId === item.productId
          )
      )
    );
    setRemovedItems((prev) => ({
      ...prev,
      [item.placeId]: [...(prev[item.placeId] ?? []), item],
    }));
  }

  function restoreItem(placeId: string, productId: string) {
    const removed = removedItems[placeId] ?? [];
    const item = removed.find((r) => r.productId === productId);
    if (!item) return;
    setRemovedItems((prev) => ({
      ...prev,
      [placeId]: removed.filter((r) => r.productId !== productId),
    }));
    setLineItems((prev) => [...prev, { ...item, quantity: 0, amount: 0 }]);
  }

  // Group lineItems by place then vendor
  const grouped = useMemo(() => {
    const placeMap = new Map<string, { placeName: string; vendors: Map<string, { vendorName: string; items: LineItem[] }> }>();
    for (const item of lineItems) {
      if (!placeMap.has(item.placeId)) {
        placeMap.set(item.placeId, { placeName: item.placeName, vendors: new Map() });
      }
      const place = placeMap.get(item.placeId)!;
      if (!place.vendors.has(item.vendorId)) {
        place.vendors.set(item.vendorId, { vendorName: item.vendorName, items: [] });
      }
      place.vendors.get(item.vendorId)!.items.push(item);
    }
    return placeMap;
  }, [lineItems]);

  const totalQty = lineItems.reduce((s, i) => s + i.quantity, 0);
  const totalAmount = lineItems.reduce((s, i) => s + i.amount, 0);

  function handleSubmit() {
    if (!salespersonId) {
      toast.error(t("collections.selectSalesperson"));
      return;
    }
    const submitItems = lineItems.filter((i) => i.quantity > 0);
    if (submitItems.length === 0) {
      toast.error("Please enter at least one quantity.");
      return;
    }
    createMutation.mutate({
      date,
      salespersonId,
      items: submitItems.map((i) => ({
        vendorId: i.vendorId,
        productId: i.productId,
        quantity: i.quantity,
        rate: i.rate,
      })),
    });
  }

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={t("collections.newEntry")} />

      {/* Date + Salesperson */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap gap-4">
            <div className="space-y-1">
              <Label htmlFor="col-date">{t("collections.date")}</Label>
              <Input
                id="col-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-44"
              />
            </div>
            <div className="space-y-1 flex-1 min-w-[220px]">
              <Label>{t("collections.salesperson")}</Label>
              <Select
                value={salespersonId || "__none__"}
                onValueChange={(val) =>
                  val && handleSalespersonChange(val === "__none__" ? "" : val)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      salespersonsLoading
                        ? t("collections.loading")
                        : t("collections.selectSalesperson")
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("collections.selectSalesperson")}</SelectItem>
                  {salespersons.map((sp) => (
                    <SelectItem key={sp.id} value={sp.id}>
                      {sp.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Line items grouped by place → vendor */}
      {!salespersonId && (
        <p className="text-muted-foreground text-sm">
          {t("collections.noSalespersonSelected")}
        </p>
      )}

      {salespersonId && vendorProductsLoading && (
        <div className="flex items-center gap-2 text-muted-foreground text-sm">
          <Loader2 className="size-4 animate-spin" />
          {t("collections.loading")}
        </div>
      )}

      {salespersonId && !vendorProductsLoading && lineItems.length === 0 && Object.keys(removedItems).length === 0 && (
        <p className="text-muted-foreground text-sm">{t("collections.noItems")}</p>
      )}

      {Array.from(grouped.entries()).map(([placeId, { placeName, vendors }]) => {
        const placeRemoved = removedItems[placeId] ?? [];
        return (
          <Card key={placeId}>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {t("collections.place")}: {placeName}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {Array.from(vendors.entries()).map(([vendorId, { vendorName, items }]) => (
                <div key={vendorId} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("collections.vendor")}: {vendorName}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => (
                      <div
                        key={item.productId}
                        className="flex flex-wrap items-center gap-3 rounded-md border p-2"
                      >
                        <span className="min-w-[140px] text-sm font-medium">
                          {item.productName}
                          <span className="ml-1 text-xs text-muted-foreground">
                            ({item.unit})
                          </span>
                        </span>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">
                            {t("collections.rate")}:
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            step={0.01}
                            value={item.rate}
                            onChange={(e) =>
                              updateItem(
                                placeId,
                                vendorId,
                                item.productId,
                                "rate",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 h-8 text-sm"
                          />
                        </div>
                        <div className="flex items-center gap-1">
                          <Label className="text-xs text-muted-foreground">
                            {t("collections.qty")}:
                          </Label>
                          <Input
                            type="number"
                            min={0}
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(
                                placeId,
                                vendorId,
                                item.productId,
                                "quantity",
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-20 h-8 text-sm"
                          />
                        </div>
                        <span className="text-sm font-medium min-w-[80px]">
                          ₹{item.amount.toFixed(2)}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => removeItem(item)}
                          title="Remove row"
                        >
                          <X className="size-4 text-muted-foreground" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}

              {/* Add back removed items for this place */}
              {placeRemoved.length > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">
                    {t("collections.addRow")}:
                  </span>
                  <Select
                    value="__add__"
                    onValueChange={(val) => {
                      if (val && val !== "__add__") restoreItem(placeId, val);
                    }}
                  >
                    <SelectTrigger className="w-52 h-8 text-sm">
                      <SelectValue placeholder={`+ ${t("collections.addRow")} from ${placeName}`} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__add__" disabled>
                        {`+ ${t("collections.addRow")} from ${placeName}`}
                      </SelectItem>
                      {placeRemoved.map((r) => (
                        <SelectItem key={r.productId} value={r.productId}>
                          {r.productName} ({r.vendorName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Totals + Submit */}
      {salespersonId && lineItems.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex gap-6 text-sm">
                <span>
                  <span className="text-muted-foreground">{t("collections.totalQty")}:</span>{" "}
                  <span className="font-medium">{totalQty}</span>
                </span>
                <span>
                  <span className="text-muted-foreground">{t("collections.totalAmount")}:</span>{" "}
                  <span className="font-medium">₹{totalAmount.toFixed(2)}</span>
                </span>
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={() => router.push("/collections")}
                >
                  {t("common.cancel")}
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending && (
                    <Loader2
                      className="size-4 animate-spin"
                      data-icon="inline-start"
                    />
                  )}
                  {t("collections.submit")}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {salespersonId && lineItems.length === 0 && !vendorProductsLoading && (
        <div className="flex justify-end">
          <Button variant="outline" onClick={() => router.push("/collections")}>
            {t("common.cancel")}
          </Button>
        </div>
      )}
    </div>
  );
}
