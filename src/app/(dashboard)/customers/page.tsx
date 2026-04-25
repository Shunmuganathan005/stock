"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { t } from "@/lib/locales";

interface Customer {
  id: string;
  name: string;
  businessName: string;
  gstin: string | null;
  phone: string;
  email: string;
}

interface CustomersResponse {
  items: Customer[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

async function fetchCustomers(
  page: number,
  search: string
): Promise<CustomersResponse> {
  const params = new URLSearchParams({
    page: String(page),
    pageSize: "20",
  });
  if (search) params.set("search", search);

  const res = await fetch(`/api/customers?${params}`);
  if (!res.ok) {
    throw new Error("Failed to fetch customers");
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

export default function CustomersPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["customers", page, search],
    queryFn: () => fetchCustomers(page, search),
  });

  const deleteMutation = useMutation({
    mutationFn: deleteCustomer,
    onSuccess: () => {
      toast.success(t("customers.customerDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["customers"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setPage(1);
    setSearch(searchInput);
  }

  function handleDelete(e: React.MouseEvent, id: string) {
    e.stopPropagation();
    if (window.confirm(t("customers.deleteConfirm"))) {
      deleteMutation.mutate(id);
    }
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        title={t("customers.title")}
        description={t("customers.description")}
      >
        {hasPermission("customers.create") && (
          <Link href="/customers/new" className={cn(buttonVariants({ variant: "default" }))}>
              <Plus className="mr-1.5 size-4" />
              {t("customers.addCustomer")}
          </Link>
        )}
      </PageHeader>

      <form onSubmit={handleSearch} className="flex items-center gap-2">
        <div className="relative max-w-sm flex-1">
          <Search className="absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("customers.searchPlaceholder")}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          {t("common.search")}
        </Button>
      </form>

      {isLoading && (
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("customers.loadingCustomers")}
        </div>
      )}

      {isError && (
        <div className="flex justify-center py-12 text-destructive">
          {t("customers.failedToLoadCustomers")}
        </div>
      )}

      {data && (
        <>
          {data.items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <p>{t("customers.noCustomersFound")}</p>
              {search && (
                <Button
                  variant="link"
                  onClick={() => {
                    setSearch("");
                    setSearchInput("");
                    setPage(1);
                  }}
                >
                  {t("common.clearSearch")}
                </Button>
              )}
            </div>
          ) : (
            <>
              <div className="rounded-lg border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("customers.columns.name")}</TableHead>
                      <TableHead>{t("customers.columns.businessName")}</TableHead>
                      <TableHead>{t("customers.columns.phone")}</TableHead>
                      <TableHead>{t("customers.columns.email")}</TableHead>
                      <TableHead>{t("customers.columns.gstin")}</TableHead>
                      {hasPermission("customers.delete") && (
                        <TableHead className="w-12" />
                      )}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.items.map((customer) => (
                      <TableRow
                        key={customer.id}
                        className="cursor-pointer"
                        onClick={() =>
                          router.push(`/customers/${customer.id}`)
                        }
                      >
                        <TableCell className="font-medium">
                          {customer.name}
                        </TableCell>
                        <TableCell>
                          {customer.businessName || "\u2014"}
                        </TableCell>
                        <TableCell>{customer.phone || "\u2014"}</TableCell>
                        <TableCell>{customer.email || "\u2014"}</TableCell>
                        <TableCell>{customer.gstin || "\u2014"}</TableCell>
                        {hasPermission("customers.delete") && (
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={(e) => handleDelete(e, customer.id)}
                              disabled={deleteMutation.isPending}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {data.totalPages > 1 && (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    {t("common.paginationTotalShort", { page: data.page, totalPages: data.totalPages, total: data.total })}
                  </p>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page <= 1}
                      onClick={() => setPage((p) => p - 1)}
                    >
                      <ChevronLeft className="mr-1 size-4" />
                      {t("common.previous")}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page >= data.totalPages}
                      onClick={() => setPage((p) => p + 1)}
                    >
                      {t("common.next")}
                      <ChevronRight className="ml-1 size-4" />
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
