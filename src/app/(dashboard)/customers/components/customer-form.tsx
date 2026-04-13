"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { t } from "@/lib/locales";

interface CustomerFormData {
  name: string;
  businessName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
}

interface CustomerFormProps {
  initialData?: Partial<CustomerFormData>;
  onSubmit: (data: CustomerFormData) => void;
  isLoading: boolean;
}

export function CustomerForm({
  initialData,
  onSubmit,
  isLoading,
}: CustomerFormProps) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: initialData?.name ?? "",
    businessName: initialData?.businessName ?? "",
    gstin: initialData?.gstin ?? "",
    phone: initialData?.phone ?? "",
    email: initialData?.email ?? "",
    address: initialData?.address ?? "",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CustomerFormData, string>>>({});

  function validate(): boolean {
    const newErrors: Partial<Record<keyof CustomerFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = t("customers.validation.nameRequired");
    } else if (formData.name.length > 200) {
      newErrors.name = t("customers.validation.nameMaxLength");
    }

    if (formData.businessName.length > 200) {
      newErrors.businessName = t("customers.validation.businessNameMaxLength");
    }

    if (formData.gstin && formData.gstin.length > 15) {
      newErrors.gstin = t("customers.validation.gstinMaxLength");
    }

    if (formData.phone && formData.phone.length > 15) {
      newErrors.phone = t("customers.validation.phoneMaxLength");
    }

    if (formData.email && formData.email.length > 0) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        newErrors.email = t("customers.validation.invalidEmail");
      }
    }

    if (formData.address.length > 500) {
      newErrors.address = t("customers.validation.addressMaxLength");
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
    }
  }

  function handleChange(
    field: keyof CustomerFormData,
    value: string
  ) {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>
            {initialData ? t("customers.form.editCustomer") : t("customers.form.newCustomer")}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">
                {t("customers.form.nameLabel")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="name"
                placeholder={t("customers.form.namePlaceholder")}
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                aria-invalid={!!errors.name}
              />
              {errors.name && (
                <p className="text-sm text-destructive">{errors.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="businessName">{t("customers.form.businessNameLabel")}</Label>
              <Input
                id="businessName"
                placeholder={t("customers.form.businessNamePlaceholder")}
                value={formData.businessName}
                onChange={(e) => handleChange("businessName", e.target.value)}
                aria-invalid={!!errors.businessName}
              />
              {errors.businessName && (
                <p className="text-sm text-destructive">
                  {errors.businessName}
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="gstin">{t("customers.form.gstinLabel")}</Label>
              <Input
                id="gstin"
                placeholder={t("customers.form.gstinPlaceholder")}
                value={formData.gstin}
                onChange={(e) => handleChange("gstin", e.target.value)}
                aria-invalid={!!errors.gstin}
              />
              {errors.gstin && (
                <p className="text-sm text-destructive">{errors.gstin}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">{t("customers.form.phoneLabel")}</Label>
              <Input
                id="phone"
                placeholder={t("customers.form.phonePlaceholder")}
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                aria-invalid={!!errors.phone}
              />
              {errors.phone && (
                <p className="text-sm text-destructive">{errors.phone}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("customers.form.emailLabel")}</Label>
            <Input
              id="email"
              type="email"
              placeholder={t("customers.form.emailPlaceholder")}
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
              aria-invalid={!!errors.email}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">{t("customers.form.addressLabel")}</Label>
            <Textarea
              id="address"
              placeholder={t("customers.form.addressPlaceholder")}
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              aria-invalid={!!errors.address}
            />
            {errors.address && (
              <p className="text-sm text-destructive">{errors.address}</p>
            )}
          </div>
        </CardContent>
        <CardFooter className="justify-end gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? initialData
                ? t("common.saving")
                : t("common.creating")
              : initialData
                ? t("common.saveChanges")
                : t("customers.form.createCustomer")}
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
}
