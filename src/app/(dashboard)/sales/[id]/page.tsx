"use client";

import { use, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Plus, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { PAYMENT_METHODS } from "@/lib/constants/enums";
import { t } from "@/lib/locales";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(amount);

function getStatusBadge(status: string) {
  switch (status) {
    case "UNPAID":
      return (
        <Badge className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
          {t("enums.paymentStatuses.UNPAID")}
        </Badge>
      );
    case "PARTIAL":
      return (
        <Badge className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
          {t("enums.paymentStatuses.PARTIAL")}
        </Badge>
      );
    case "PAID":
      return (
        <Badge className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
          {t("enums.paymentStatuses.PAID")}
        </Badge>
      );
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

export default function SaleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("CASH");
  const [paymentReference, setPaymentReference] = useState("");
  const [paymentNotes, setPaymentNotes] = useState("");

  // Fetch sale details
  const {
    data: saleData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["sale", id],
    queryFn: async () => {
      const res = await fetch(`/api/sales/${id}`);
      if (!res.ok) throw new Error("Failed to fetch sale");
      const json = await res.json();
      return json.data;
    },
  });

  // Record payment mutation
  const recordPaymentMutation = useMutation({
    mutationFn: async (payload: {
      saleId: string;
      amount: number;
      method: string;
      referenceNumber: string;
      notes: string;
    }) => {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error || "Failed to record payment");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("sales.payments.paymentRecordedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["sale", id] });
      setPaymentDialogOpen(false);
      resetPaymentForm();
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const resetPaymentForm = () => {
    setPaymentAmount("");
    setPaymentMethod("CASH");
    setPaymentReference("");
    setPaymentNotes("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !saleData) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">{t("sales.saleNotFound")}</p>
        <Link href="/sales" className={cn(buttonVariants({ variant: "outline" }))}>
          {t("sales.backToSales")}
        </Link>
      </div>
    );
  }

  const sale = saleData;
  const totalPaid = sale.payments?.reduce(
    (sum: number, p: { amount: number }) => sum + p.amount,
    0
  ) ?? 0;
  const remaining = Math.round((sale.grandTotal - totalPaid) * 100) / 100;

  const handleRecordPayment = () => {
    const amount = parseFloat(paymentAmount);
    if (!amount || amount <= 0) {
      toast.error(t("sales.validation.invalidAmount"));
      return;
    }
    if (amount > remaining) {
      toast.error(t("sales.validation.amountExceedsBalance", { amount: formatCurrency(remaining) }));
      return;
    }

    recordPaymentMutation.mutate({
      saleId: id,
      amount,
      method: paymentMethod,
      referenceNumber: paymentReference,
      notes: paymentNotes,
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={t("sales.saleTitle", { number: sale.saleNumber })}>
        <Link href="/sales" className={cn(buttonVariants({ variant: "outline" }))}>
          <ArrowLeft data-icon="inline-start" />
          {t("sales.backToSales")}
        </Link>
      </PageHeader>

      {/* Sale Info Card */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sales.detail.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("sales.detail.saleNumber")}</p>
              <p className="font-medium">{sale.saleNumber}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("sales.detail.date")}</p>
              <p className="font-medium">
                {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("sales.detail.customer")}</p>
              <p className="font-medium">
                {sale.customer?.businessName || sale.customer?.name}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("sales.detail.paymentStatus")}</p>
              <div>{getStatusBadge(sale.paymentStatus)}</div>
            </div>
          </div>
          {sale.notes && (
            <div className="mt-4 space-y-1">
              <p className="text-sm text-muted-foreground">{t("sales.detail.notes")}</p>
              <p className="text-sm">{sale.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardHeader>
          <CardTitle>{t("sales.columns.items")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("sales.lineItems.product")}</TableHead>
                  <TableHead className="text-right">{t("sales.lineItems.quantity")}</TableHead>
                  <TableHead className="text-right">{t("sales.lineItems.unitPrice")}</TableHead>
                  <TableHead className="text-right">{t("sales.lineItems.taxPercent")}</TableHead>
                  <TableHead className="text-right">{t("sales.lineItems.taxAmount")}</TableHead>
                  <TableHead className="text-right">{t("sales.lineItems.total")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sale.items?.map(
                  (item: {
                    id: string;
                    product: { name: string; sku: string };
                    quantity: number;
                    unitPrice: number;
                    taxRate: number;
                    taxAmount: number;
                    totalPrice: number;
                  }) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.product.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {item.product.sku}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        {item.quantity}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.unitPrice)}
                      </TableCell>
                      <TableCell className="text-right">
                        {item.taxRate}%
                      </TableCell>
                      <TableCell className="text-right">
                        {formatCurrency(item.taxAmount)}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {formatCurrency(item.totalPrice)}
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>

          {/* Totals Summary */}
          <div className="mt-4 flex justify-end">
            <div className="w-[280px] space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("sales.summary.subtotal")}</span>
                <span>{formatCurrency(sale.subtotal)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">{t("sales.summary.taxTotal")}</span>
                <span>{formatCurrency(sale.taxTotal)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-medium">
                <span>{t("sales.summary.grandTotal")}</span>
                <span>{formatCurrency(sale.grandTotal)}</span>
              </div>
              {totalPaid > 0 && (
                <>
                  <div className="flex justify-between text-sm text-green-600">
                    <span>{t("sales.summary.paid")}</span>
                    <span>{formatCurrency(totalPaid)}</span>
                  </div>
                  {remaining > 0 && (
                    <div className="flex justify-between text-sm text-red-600 font-medium">
                      <span>{t("sales.summary.remaining")}</span>
                      <span>{formatCurrency(remaining)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payments Section */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{t("sales.payments.title")}</CardTitle>
            <CardDescription>
              {totalPaid > 0
                ? t("sales.payments.paidOf", { amount: formatCurrency(totalPaid), total: formatCurrency(sale.grandTotal) })
                : t("sales.payments.noPaymentsYet")}
            </CardDescription>
          </div>
          {hasPermission("payments.record") &&
            sale.paymentStatus !== "PAID" && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPaymentDialogOpen(true)}
              >
                <Plus data-icon="inline-start" />
                {t("sales.payments.recordPayment")}
              </Button>
            )}
        </CardHeader>
        <CardContent>
          {sale.payments && sale.payments.length > 0 ? (
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("sales.payments.columns.date")}</TableHead>
                    <TableHead className="text-right">{t("sales.payments.columns.amount")}</TableHead>
                    <TableHead>{t("sales.payments.columns.method")}</TableHead>
                    <TableHead>{t("sales.payments.columns.reference")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sale.payments.map(
                    (payment: {
                      id: string;
                      createdAt: string;
                      amount: number;
                      method: string;
                      referenceNumber: string;
                    }) => (
                      <TableRow key={payment.id}>
                        <TableCell>
                          {new Date(payment.createdAt).toLocaleDateString(
                            "en-IN",
                            {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(payment.amount)}
                        </TableCell>
                        <TableCell>
                          {PAYMENT_METHODS.find(
                            (m) => m.value === payment.method
                          )?.label ?? payment.method}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {payment.referenceNumber || "-"}
                        </TableCell>
                      </TableRow>
                    )
                  )}
                </TableBody>
              </Table>
            </div>
          ) : (
            <p className="text-center py-6 text-muted-foreground">
              {t("sales.payments.noPaymentsRecorded")}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Created By Info */}
      {sale.createdBy && (
        <Card>
          <CardHeader>
            <CardTitle>{t("sales.createdBy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3">
              <div>
                <p className="font-medium">{sale.createdBy.name}</p>
                <p className="text-sm text-muted-foreground">
                  {sale.createdBy.email}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Record Payment Dialog */}
      <Dialog
        open={paymentDialogOpen}
        onOpenChange={(open) => {
          setPaymentDialogOpen(open);
          if (!open) resetPaymentForm();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{t("sales.payments.recordPayment")}</DialogTitle>
            <DialogDescription>
              {t("sales.payments.remainingBalance", { amount: formatCurrency(remaining) })}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="payment-amount">{t("sales.payments.amountLabel")}</Label>
              <Input
                id="payment-amount"
                type="number"
                min={0.01}
                max={remaining}
                step={0.01}
                placeholder={`Max: ${remaining}`}
                value={paymentAmount}
                onChange={(e) => setPaymentAmount(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>{t("sales.payments.paymentMethodLabel")}</Label>
              <Select value={paymentMethod} onValueChange={(v) => v && setPaymentMethod(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("sales.payments.selectMethod")} />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((method) => (
                    <SelectItem key={method.value} value={method.value}>
                      {method.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-reference">{t("sales.payments.referenceLabel")}</Label>
              <Input
                id="payment-reference"
                placeholder={t("sales.payments.referencePlaceholder")}
                value={paymentReference}
                onChange={(e) => setPaymentReference(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="payment-notes">{t("sales.payments.notesLabel")}</Label>
              <Textarea
                id="payment-notes"
                placeholder={t("sales.payments.notesPlaceholder")}
                value={paymentNotes}
                onChange={(e) => setPaymentNotes(e.target.value)}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              onClick={handleRecordPayment}
              disabled={recordPaymentMutation.isPending}
            >
              {recordPaymentMutation.isPending && (
                <Loader2
                  className="size-4 animate-spin"
                  data-icon="inline-start"
                />
              )}
              {t("sales.payments.recordPayment")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
