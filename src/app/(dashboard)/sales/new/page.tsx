"use client";

import { useState, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { t } from "@/lib/locales";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

interface LineItem {
  key: number;
  productId: string;
  unitPrice: number;
  taxRate: number;
  quantity: number;
  availableStock: number;
  productName: string;
}

export default function NewSalePage() {
  const router = useRouter();
  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [notes, setNotes] = useState("");
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [nextKey, setNextKey] = useState(1);

  // Fetch next sale number
  const { data: saleNumberData } = useQuery({
    queryKey: ["sales", "next-number"],
    queryFn: async () => {
      const res = await fetch("/api/sales/next-number");
      if (!res.ok) throw new Error("Failed to fetch sale number");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch customers (searchable)
  const { data: customersData, isLoading: customersLoading } = useQuery({
    queryKey: ["customers", { search: customerSearch }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("pageSize", "50");
      if (customerSearch) params.set("search", customerSearch);
      const res = await fetch(`/api/customers?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch customers");
      const json = await res.json();
      return json.data;
    },
  });

  // Fetch products
  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("pageSize", "500");
      const res = await fetch(`/api/products?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch products");
      const json = await res.json();
      return json.data;
    },
  });

  const customers = customersData?.items ?? [];
  const products = productsData?.items ?? [];

  // Create sale mutation
  const createSaleMutation = useMutation({
    mutationFn: async (payload: {
      customerId: string;
      notes: string;
      items: {
        productId: string;
        quantity: number;
        unitPrice: number;
        taxRate: number;
      }[];
    }) => {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to create sale");
      }
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(t("sales.saleCreatedSuccess"));
      router.push(`/sales/${data.data.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addLineItem = useCallback(() => {
    setLineItems((prev) => [
      ...prev,
      {
        key: nextKey,
        productId: "",
        unitPrice: 0,
        taxRate: 0,
        quantity: 1,
        availableStock: 0,
        productName: "",
      },
    ]);
    setNextKey((k) => k + 1);
  }, [nextKey]);

  const removeLineItem = useCallback((key: number) => {
    setLineItems((prev) => prev.filter((item) => item.key !== key));
  }, []);

  const updateLineItem = useCallback(
    (key: number, updates: Partial<LineItem>) => {
      setLineItems((prev) =>
        prev.map((item) => (item.key === key ? { ...item, ...updates } : item))
      );
    },
    []
  );

  const handleProductSelect = useCallback(
    (key: number, productId: string) => {
      const product = products.find(
        (p: { id: string }) => p.id === productId
      );
      if (product) {
        updateLineItem(key, {
          productId: product.id,
          unitPrice: product.sellingPrice,
          taxRate: product.taxRate?.rate ?? 0,
          availableStock: product.stockQuantity,
          productName: product.name,
        });
      }
    },
    [products, updateLineItem]
  );

  // Calculations
  const subtotal = lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.quantity,
    0
  );
  const taxTotal = lineItems.reduce(
    (sum, item) => sum + (item.unitPrice * item.quantity * item.taxRate) / 100,
    0
  );
  const grandTotal = subtotal + taxTotal;

  const handleSubmit = () => {
    if (!customerId) {
      toast.error(t("sales.validation.selectCustomer"));
      return;
    }

    if (lineItems.length === 0) {
      toast.error(t("sales.validation.addAtLeastOneItem"));
      return;
    }

    const invalidItems = lineItems.filter(
      (item) => !item.productId || item.quantity < 1
    );
    if (invalidItems.length > 0) {
      toast.error(t("sales.validation.fillAllItemDetails"));
      return;
    }

    const overStockItems = lineItems.filter(
      (item) => item.quantity > item.availableStock
    );
    if (overStockItems.length > 0) {
      toast.error(
        t("sales.validation.insufficientStock", { products: overStockItems.map((i) => i.productName).join(", ") })
      );
      return;
    }

    createSaleMutation.mutate({
      customerId,
      notes,
      items: lineItems.map((item) => ({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
      })),
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader
        title={t("sales.createNewSale")}
        description={
          saleNumberData?.saleNumber
            ? t("sales.saleNumberDescription", { number: saleNumberData.saleNumber })
            : t("sales.loadingSaleNumber")
        }
      />

      {/* Customer Selection */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sales.customer.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <Label>{t("sales.customer.searchLabel")}</Label>
            <Input
              placeholder={t("sales.customer.searchPlaceholder")}
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>{t("sales.customer.selectLabel")}</Label>
            <Select value={customerId} onValueChange={(v) => v && setCustomerId(v)}>
              <SelectTrigger className="w-full">
                <SelectValue
                  placeholder={
                    customersLoading
                      ? t("sales.customer.loadingCustomers")
                      : t("sales.customer.selectCustomer")
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {customers.map(
                  (customer: {
                    id: string;
                    name: string;
                    businessName?: string;
                    phone?: string;
                  }) => (
                    <SelectItem key={customer.id} value={customer.id}>
                      {customer.businessName || customer.name}
                      {customer.phone ? ` - ${customer.phone}` : ""}
                    </SelectItem>
                  )
                )}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Line Items */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>{t("sales.lineItems.title")}</CardTitle>
          <Button variant="outline" size="sm" onClick={addLineItem}>
            <Plus data-icon="inline-start" />
            {t("sales.lineItems.addItem")}
          </Button>
        </CardHeader>
        <CardContent>
          {lineItems.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {t("sales.lineItems.noItems")}
            </p>
          ) : (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[200px]">{t("sales.lineItems.product")}</TableHead>
                    <TableHead className="w-[100px]">{t("sales.lineItems.quantity")}</TableHead>
                    <TableHead className="w-[120px]">{t("sales.lineItems.unitPrice")}</TableHead>
                    <TableHead className="w-[80px]">{t("sales.lineItems.taxPercent")}</TableHead>
                    <TableHead className="w-[100px]">{t("sales.lineItems.available")}</TableHead>
                    <TableHead className="w-[120px] text-right">
                      {t("sales.lineItems.lineTotal")}
                    </TableHead>
                    <TableHead className="w-[60px]" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {lineItems.map((item) => {
                    const lineSubtotal = item.unitPrice * item.quantity;
                    const lineTax =
                      (lineSubtotal * item.taxRate) / 100;
                    const lineTotal = lineSubtotal + lineTax;

                    return (
                      <TableRow key={item.key}>
                        <TableCell>
                          <Select
                            value={item.productId}
                            onValueChange={(val) =>
                              val && handleProductSelect(item.key, val)
                            }
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder={t("sales.lineItems.selectProduct")} />
                            </SelectTrigger>
                            <SelectContent>
                              {products.map(
                                (product: {
                                  id: string;
                                  name: string;
                                  sku: string;
                                }) => (
                                  <SelectItem
                                    key={product.id}
                                    value={product.id}
                                  >
                                    {product.name} ({product.sku})
                                  </SelectItem>
                                )
                              )}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={1}
                            max={item.availableStock}
                            value={item.quantity}
                            onChange={(e) =>
                              updateLineItem(item.key, {
                                quantity:
                                  parseInt(e.target.value) || 1,
                              })
                            }
                            className="w-[80px]"
                          />
                        </TableCell>
                        <TableCell className="font-medium">
                          {formatCurrency(item.unitPrice)}
                        </TableCell>
                        <TableCell>{item.taxRate}%</TableCell>
                        <TableCell>
                          <span
                            className={
                              item.quantity > item.availableStock
                                ? "text-red-600 font-medium"
                                : "text-muted-foreground"
                            }
                          >
                            {item.availableStock}
                          </span>
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(lineTotal)}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeLineItem(item.key)}
                          >
                            <Trash2 className="size-4 text-muted-foreground" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary */}
          {lineItems.length > 0 && (
            <div className="mt-4 flex justify-end">
              <div className="w-[280px] space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("sales.summary.subtotal")}</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("sales.summary.taxTotal")}</span>
                  <span>{formatCurrency(taxTotal)}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-medium">
                  <span>{t("sales.summary.grandTotal")}</span>
                  <span>{formatCurrency(grandTotal)}</span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notes */}
      <Card>
        <CardHeader>
          <CardTitle>{t("common.notes")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder={t("sales.notesPlaceholder")}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={() => router.push("/sales")}>
          {t("common.cancel")}
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={createSaleMutation.isPending}
        >
          {createSaleMutation.isPending && (
            <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
          )}
          {t("sales.createSale")}
        </Button>
      </div>
    </div>
  );
}
