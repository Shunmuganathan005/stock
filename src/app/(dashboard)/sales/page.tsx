"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { PAYMENT_STATUSES } from "@/lib/constants/enums";
import { t } from "@/lib/locales";
import { Input } from "@/components/ui/input";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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

const PAGE_SIZE = 20;

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

export default function SalesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [search, setSearch] = useState("");
  const [paymentStatus, setPaymentStatus] = useState<string>("ALL");
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ["sales", { search, paymentStatus, page }],
    queryFn: async () => {
      const params = new URLSearchParams();
      params.set("page", page.toString());
      params.set("pageSize", PAGE_SIZE.toString());
      if (search) params.set("search", search);
      if (paymentStatus && paymentStatus !== "ALL") {
        params.set("paymentStatus", paymentStatus);
      }
      const res = await fetch(`/api/sales?${params.toString()}`);
      if (!res.ok) throw new Error("Failed to fetch sales");
      const json = await res.json();
      return json.data;
    },
  });

  const sales = data?.items ?? [];
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={t("sales.title")} description={t("sales.description")}>
        {hasPermission("sales.create") && (
          <Link href="/sales/new" className={cn(buttonVariants({ variant: "default" }))}>
            <Plus data-icon="inline-start" />
            {t("sales.newSale")}
          </Link>
        )}
      </PageHeader>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("sales.filter.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9"
          />
        </div>
        <Select
          value={paymentStatus}
          onValueChange={(val) => {
            if (val) setPaymentStatus(val);
            setPage(1);
          }}
        >
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder={t("sales.filter.paymentStatus")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t("sales.filter.allStatuses")}</SelectItem>
            {PAYMENT_STATUSES.map((status) => (
              <SelectItem key={status.value} value={status.value}>
                {status.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("sales.columns.saleNumber")}</TableHead>
              <TableHead>{t("sales.columns.customer")}</TableHead>
              <TableHead>{t("sales.columns.date")}</TableHead>
              <TableHead className="text-right">{t("sales.columns.grandTotal")}</TableHead>
              <TableHead>{t("sales.columns.paymentStatus")}</TableHead>
              <TableHead className="text-right">{t("sales.columns.items")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  {t("sales.loadingSales")}
                </TableCell>
              </TableRow>
            ) : sales.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("sales.noSalesFound")}
                </TableCell>
              </TableRow>
            ) : (
              sales.map(
                (sale: {
                  id: string;
                  saleNumber: string;
                  customer: { name: string; businessName?: string };
                  createdAt: string;
                  grandTotal: number;
                  paymentStatus: string;
                  _count: { items: number };
                }) => (
                  <TableRow
                    key={sale.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/sales/${sale.id}`)}
                  >
                    <TableCell className="font-medium">
                      {sale.saleNumber}
                    </TableCell>
                    <TableCell>
                      {sale.customer.businessName || sale.customer.name}
                    </TableCell>
                    <TableCell>
                      {new Date(sale.createdAt).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(sale.grandTotal)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sale.paymentStatus)}
                    </TableCell>
                    <TableCell className="text-right">
                      {sale._count.items}
                    </TableCell>
                  </TableRow>
                )
              )
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("common.paginationPage", { page, totalPages })}
            {data?.total != null && ` (${data.total} total)`}
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
