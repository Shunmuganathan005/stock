"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { t } from "@/lib/locales";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  category: { id: string; name: string };
  taxRate: { id: string; name: string; percentage: number };
}

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data: product, isLoading } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("products.productDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push("/products");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.failedToDeleteProduct"));
    },
  });

  function getStockColor(qty: number, minLevel: number) {
    if (qty === 0) return "destructive" as const;
    if (qty < minLevel) return "secondary" as const;
    return "default" as const;
  }

  function getStockLabel(qty: number, minLevel: number) {
    if (qty === 0) return t("products.status.outOfStock");
    if (qty < minLevel) return t("products.status.lowStock");
    return t("products.status.inStock");
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t("products.loadingProduct")}</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">{t("products.productNotFound")}</p>
      </div>
    );
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(value);

  return (
    <div className="space-y-6">
      <PageHeader title={product.name} description={product.sku}>
        <Link href="/products" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft className="size-4" />
          {t("common.back")}
        </Link>
        {hasPermission("products.edit") && (
          <Link href={`/products/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
            <Pencil className="size-4" />
            {t("common.edit")}
          </Link>
        )}
        {hasPermission("products.delete") && (
          <Button
            variant="destructive"
            onClick={() => setDeleteDialogOpen(true)}
          >
            <Trash2 className="size-4" />
            {t("common.delete")}
          </Button>
        )}
      </PageHeader>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("products.detail.title")}</CardTitle>
            <CardDescription>{t("products.detail.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.name")}</p>
                <p className="mt-1">{product.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.sku")}</p>
                <p className="mt-1 font-mono">{product.sku}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.barcode")}</p>
                <p className="mt-1 font-mono">{product.barcode || t("common.na")}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.unit")}</p>
                <p className="mt-1">{product.unit}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.category")}</p>
                <p className="mt-1">{product.category?.name}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.detail.taxRate")}</p>
                <p className="mt-1">
                  {product.taxRate?.name} ({product.taxRate?.percentage}%)
                </p>
              </div>
            </div>
            {product.description && (
              <>
                <Separator />
                <div>
                  <p className="text-xs font-medium text-muted-foreground">{t("products.detail.descriptionLabel")}</p>
                  <p className="mt-1 text-sm">{product.description}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("products.pricing.title")}</CardTitle>
            <CardDescription>{t("products.pricing.description")}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.pricing.costPrice")}</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.costPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.pricing.sellingPrice")}</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.sellingPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.pricing.margin")}</p>
                <p className="mt-1 text-lg font-semibold">
                  {formatCurrency(product.sellingPrice - product.costPrice)}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.pricing.marginPercent")}</p>
                <p className="mt-1 text-lg font-semibold">
                  {product.costPrice > 0
                    ? (
                        ((product.sellingPrice - product.costPrice) /
                          product.costPrice) *
                        100
                      ).toFixed(1)
                    : "0"}
                  %
                </p>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs font-medium text-muted-foreground">{t("products.pricing.stockQuantity")}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-lg font-semibold">
                    {product.stockQuantity}
                  </span>
                  <Badge
                    variant={getStockColor(
                      product.stockQuantity,
                      product.minStockLevel
                    )}
                  >
                    {getStockLabel(
                      product.stockQuantity,
                      product.minStockLevel
                    )}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  {t("products.pricing.minStockLevel")}
                </p>
                <p className="mt-1 text-lg font-semibold">
                  {product.minStockLevel}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("products.deleteDialog.description", { name: product.name })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
