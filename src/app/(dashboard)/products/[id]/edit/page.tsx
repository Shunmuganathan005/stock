"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/app/(dashboard)/products/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/locales";

interface Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  barcode: string | null;
  categoryId: string;
  taxRateId: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
}

export default function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: product, isLoading: isLoadingProduct } = useQuery<Product>({
    queryKey: ["product", id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, unknown> | object) => {
      const res = await fetch(`/api/products/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("products.productUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["product", id] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      router.push(`/products/${id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.failedToUpdateProduct"));
    },
  });

  if (isLoadingProduct) {
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

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products.editProduct")}
        description={t("products.editingProduct", { name: product.name })}
      />

      <Card>
        <CardContent>
          <ProductForm
            initialData={{
              name: product.name,
              description: product.description ?? "",
              sku: product.sku,
              barcode: product.barcode ?? "",
              categoryId: product.categoryId,
              taxRateId: product.taxRateId,
              costPrice: product.costPrice,
              sellingPrice: product.sellingPrice,
              stockQuantity: product.stockQuantity,
              minStockLevel: product.minStockLevel,
              unit: product.unit,
            }}
            onSubmit={(data) => updateMutation.mutate(data)}
            isLoading={updateMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
