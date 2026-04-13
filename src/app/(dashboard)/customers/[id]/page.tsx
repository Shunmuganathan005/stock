"use client";

import { use } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Building2,
  Phone,
  Mail,
  MapPin,
  FileText,
} from "lucide-react";
import { t } from "@/lib/locales";

interface Customer {
  id: string;
  name: string;
  businessName: string;
  gstin: string | null;
  phone: string;
  email: string;
  address: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sales: number;
  };
}

interface Sale {
  id: string;
  saleNumber: string;
  saleDate: string;
  grandTotal: number;
  paymentStatus: "UNPAID" | "PARTIAL" | "PAID";
}

interface SalesResponse {
  items: Sale[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function fetchCustomer(id: string): Promise<Customer> {
  const res = await fetch(`/api/customers/${id}`);
  if (!res.ok) {
    throw new Error("Failed to fetch customer");
  }
  const json = await res.json();
  return json.data;
}

async function fetchCustomerSales(customerId: string): Promise<SalesResponse> {
  const params = new URLSearchParams({
    customerId,
    pageSize: "10",
  });
  const res = await fetch(`/api/sales?${params}`);
  if (!res.ok) {
    throw new Error("Failed to fetch sales");
  }
  const json = await res.json();
  return json.data;
}

async function deleteCustomer(id: string): Promise<void> {
  const res = await fetch(`/api/customers/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const json = await res.json().catch(() => null);
    throw new Error(json?.error ?? "Failed to delete customer");
  }
}

const paymentStatusVariant: Record<string, "default" | "secondary" | "destructive"> = {
  PAID: "default",
  PARTIAL: "secondary",
  UNPAID: "destructive",
};

export default function CustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const {
    data: customer,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["customer", id],
    queryFn: () => fetchCustomer(id),
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["customer-sales", id],
    queryFn: () => fetchCustomerSales(id),
    enabled: !!customer,
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success(t("customers.customerDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      router.push("/customers");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleDelete() {
    if (window.confirm(t("customers.deleteConfirm"))) {
      deleteMutation.mutate(id);
    }
  }

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
        title={customer.name}
        description={customer.businessName || undefined}
      >
        <Link href="/customers" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft className="mr-1.5 size-4" />
            {t("common.back")}
        </Link>
        {hasPermission("customers.edit") && (
          <Link href={`/customers/${id}/edit`} className={cn(buttonVariants({ variant: "outline" }))}>
              <Pencil className="mr-1.5 size-4" />
              {t("common.edit")}
          </Link>
        )}
        {hasPermission("customers.delete") && (
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={deleteMutation.isPending}
          >
            <Trash2 className="mr-1.5 size-4" />
            {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
          </Button>
        )}
      </PageHeader>

      {/* Customer Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("customers.detail.title")}</CardTitle>
          <CardDescription>
            {t("customers.detail.addedOn", { date: new Date(customer.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" }) })}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.businessName")}
                </p>
                <p>{customer.businessName || "\u2014"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <FileText className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.gstin")}
                </p>
                <p>{customer.gstin || "\u2014"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.phone")}
                </p>
                <p>{customer.phone || "\u2014"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.email")}
                </p>
                <p>{customer.email || "\u2014"}</p>
              </div>
            </div>

            <div className="flex items-start gap-3 sm:col-span-2">
              <MapPin className="mt-0.5 size-4 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  {t("customers.detail.address")}
                </p>
                <p className="whitespace-pre-line">
                  {customer.address || "\u2014"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Purchase History */}
      <Separator />

      <div className="space-y-4">
        <h3 className="text-lg font-semibold">{t("customers.purchaseHistory.title")}</h3>

        {salesLoading && (
          <div className="flex justify-center py-8 text-muted-foreground">
            {t("customers.purchaseHistory.loadingSales")}
          </div>
        )}

        {salesData && salesData.items.length === 0 && (
          <div className="flex justify-center py-8 text-muted-foreground">
            {t("customers.purchaseHistory.noPurchases")}
          </div>
        )}

        {salesData && salesData.items.length > 0 && (
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("customers.purchaseHistory.saleNumber")}</TableHead>
                  <TableHead>{t("common.date")}</TableHead>
                  <TableHead className="text-right">{t("customers.purchaseHistory.total")}</TableHead>
                  <TableHead>{t("customers.purchaseHistory.paymentStatus")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {salesData.items.map((sale) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/sales/${sale.id}`)}
                  >
                    <TableCell className="font-medium">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.saleDate).toLocaleDateString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(sale.grandTotal)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          paymentStatusVariant[sale.paymentStatus] ?? "secondary"
                        }
                      >
                        {sale.paymentStatus}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {salesData && salesData.totalPages > 1 && (
          <p className="text-sm text-muted-foreground">
            {t("customers.purchaseHistory.showingCount", { count: salesData.items.length, total: salesData.total })}{" "}
            <Link
              href={`/sales?customerId=${id}`}
              className="text-primary underline underline-offset-4 hover:text-primary/80"
            >
              {t("customers.purchaseHistory.viewAll")}
            </Link>
          </p>
        )}
      </div>
    </div>
  );
}
