"use client";

import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/app/(dashboard)/customers/components/customer-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/locales";

interface CustomerFormData {
  name: string;
  businessName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
}

async function createCustomer(data: CustomerFormData) {
  const res = await fetch("/api/customers", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? "Failed to create customer");
  }

  return res.json();
}

export default function NewCustomerPage() {
  const router = useRouter();

  const mutation = useMutation({
    mutationFn: createCustomer,
    onSuccess: () => {
      toast.success(t("customers.customerCreatedSuccess"));
      router.push("/customers");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t("customers.addCustomer")} description={t("customers.addCustomerDescription")}>
        <Link href="/customers" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="mr-1.5 size-4" />
            {t("common.back")}
        </Link>
      </PageHeader>

      <div className="max-w-2xl">
        <CustomerForm
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isPending}
        />
      </div>
    </div>
  );
}
