"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/app/(dashboard)/customers/components/customer-form";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { t } from "@/lib/locales";

interface Customer {
  id: string;
  name: string;
  businessName: string;
  gstin: string | null;
  phone: string;
  email: string;
  address: string;
}

interface CustomerFormData {
  name: string;
  businessName: string;
  gstin: string;
  phone: string;
  email: string;
  address: string;
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch customer");
  }
  const json = await res.json();
  return json.data;
}

async function updateCustomer(id: string, data: CustomerFormData) {
  const res = await fetch(`/api/customers/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? "Failed to update customer");
  }

  return res.json();
}

export default function EditCustomerPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });

  const mutation = useMutation({
    mutationFn: (data: CustomerFormData) => updateCustomer(id, data),
    onSuccess: () => {
      toast.success(t("customers.customerUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["customer", id] });
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push(`/customers/${id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center p-12 text-muted-foreground">
        {t("customers.loadingCustomer")}
      </div>
    );
  }

  if (isError || !customer) {
    return (
      <div className="space-y-4 p-6">
        <div className="flex justify-center py-12 text-destructive">
          {t("customers.customerNotFound")}
        </div>
        <div className="flex justify-center">
          <Link href="/customers" className={cn(buttonVariants({ variant: "outline" }))}>
              <ArrowLeft className="mr-1.5 size-4" />
              {t("customers.backToCustomers")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t("customers.editCustomer")}
        description={t("customers.editingCustomer", { name: customer.name })}
      >
        <Link href={`/customers/${id}`} className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="mr-1.5 size-4" />
            {t("common.back")}
        </Link>
      </PageHeader>

      <div className="max-w-2xl">
        <CustomerForm
          initialData={{
            name: customer.name,
            businessName: customer.businessName,
            gstin: customer.gstin ?? "",
            phone: customer.phone,
            email: customer.email,
            address: customer.address,
          }}
          onSubmit={(data) => mutation.mutate(data)}
          isLoading={mutation.isPending}
        />
      </div>
    </div>
  );
}
