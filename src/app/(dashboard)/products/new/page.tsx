"use client";

import { useRouter } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { PageHeader } from "@/components/layout/page-header";
import { ProductForm } from "@/app/(dashboard)/products/components/product-form";
import { Card, CardContent } from "@/components/ui/card";
import { t } from "@/lib/locales";

export default function NewProductPage() {
  const router = useRouter();

  const createMutation = useMutation({
    mutationFn: async (data: Record<string, unknown> | object) => {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("products.productCreatedSuccess"));
      router.push("/products");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.failedToCreateProduct"));
    },
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products.addProduct")}
        description={t("products.addProductDescription")}
      />

      <Card>
        <CardContent>
          <ProductForm
            onSubmit={(data) => createMutation.mutate(data)}
            isLoading={createMutation.isPending}
          />
        </CardContent>
      </Card>
    </div>
  );
}
