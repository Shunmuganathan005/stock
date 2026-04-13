"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UNITS } from "@/lib/constants/enums";
import { t } from "@/lib/locales";

interface ProductFormData {
  name: string;
  description: string;
  sku: string;
  barcode: string;
  categoryId: string;
  taxRateId: string;
  costPrice: number;
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  unit: string;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  isLoading: boolean;
}

export function ProductForm({
  initialData,
  onSubmit,
  isLoading,
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>({
    name: "",
    description: "",
    sku: "",
    barcode: "",
    categoryId: "",
    taxRateId: "",
    costPrice: 0,
    sellingPrice: 0,
    stockQuantity: 0,
    minStockLevel: 10,
    unit: "PIECE",
  });

  useEffect(() => {
    if (initialData) {
      setForm((prev) => ({ ...prev, ...initialData }));
    }
  }, [initialData]);

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { id: string; name: string }[];
    },
  });

  const { data: taxRates } = useQuery({
    queryKey: ["tax-rates"],
    queryFn: async () => {
      const res = await fetch("/api/tax-rates");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data as { id: string; name: string; percentage: number }[];
    },
  });

  function handleChange(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value, type } = e.target as HTMLInputElement;
    setForm((prev) => ({
      ...prev,
      [name]: type === "number" ? parseFloat(value) || 0 : value,
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSubmit(form);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">{t("products.form.nameLabel")}</Label>
          <Input
            id="name"
            name="name"
            value={form.name}
            onChange={handleChange}
            placeholder={t("products.form.namePlaceholder")}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sku">{t("products.form.skuLabel")}</Label>
          <Input
            id="sku"
            name="sku"
            value={form.sku}
            onChange={handleChange}
            placeholder={t("products.form.skuPlaceholder")}
            required
          />
        </div>

        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">{t("products.form.descriptionLabel")}</Label>
          <Textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            placeholder={t("products.form.descriptionPlaceholder")}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="barcode">{t("products.form.barcodeLabel")}</Label>
          <Input
            id="barcode"
            name="barcode"
            value={form.barcode}
            onChange={handleChange}
            placeholder={t("products.form.barcodePlaceholder")}
          />
        </div>

        <div className="space-y-2">
          <Label>{t("products.form.unitLabel")}</Label>
          <Select
            value={form.unit}
            onValueChange={(val) =>
              val && setForm((prev) => ({ ...prev, unit: val }))
            }
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("products.form.unitPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {UNITS.map((u) => (
                <SelectItem key={u.value} value={u.value}>
                  {u.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("products.form.categoryLabel")}</Label>
          <Select
            value={form.categoryId}
            onValueChange={(val) =>
              val && setForm((prev) => ({ ...prev, categoryId: val }))
            }
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("products.form.categoryPlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {categories?.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>{t("products.form.taxRateLabel")}</Label>
          <Select
            value={form.taxRateId}
            onValueChange={(val) =>
              val && setForm((prev) => ({ ...prev, taxRateId: val }))
            }
            required
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={t("products.form.taxRatePlaceholder")} />
            </SelectTrigger>
            <SelectContent>
              {taxRates?.map((tax) => (
                <SelectItem key={tax.id} value={tax.id}>
                  {tax.name} ({tax.percentage}%)
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="costPrice">{t("products.form.costPriceLabel")}</Label>
          <Input
            id="costPrice"
            name="costPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.costPrice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sellingPrice">{t("products.form.sellingPriceLabel")}</Label>
          <Input
            id="sellingPrice"
            name="sellingPrice"
            type="number"
            min="0"
            step="0.01"
            value={form.sellingPrice}
            onChange={handleChange}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="stockQuantity">{t("products.form.stockQuantityLabel")}</Label>
          <Input
            id="stockQuantity"
            name="stockQuantity"
            type="number"
            min="0"
            step="1"
            value={form.stockQuantity}
            onChange={handleChange}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="minStockLevel">{t("products.form.minStockLevelLabel")}</Label>
          <Input
            id="minStockLevel"
            name="minStockLevel"
            type="number"
            min="0"
            step="1"
            value={form.minStockLevel}
            onChange={handleChange}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? t("common.saving") : initialData ? t("products.form.updateProduct") : t("products.form.createProduct")}
        </Button>
      </div>
    </form>
  );
}
