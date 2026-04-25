"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogClose,
} from "@/components/ui/dialog";
import { Search, Plus, Trash2 } from "lucide-react";
import { t } from "@/lib/locales";

interface Product {
  id: string;
  name: string;
  sku: string;
  category: { id: string; name: string };
  sellingPrice: number;
  stockQuantity: number;
  minStockLevel: number;
  isActive: boolean;
}

interface PaginatedProducts {
  items: Product[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function ProductsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const { data, isLoading } = useQuery<PaginatedProducts>({
    queryKey: ["products", { search, page }],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: String(page),
        pageSize: "10",
      });
      if (search) params.set("search", search);
      const res = await fetch(`/api/products?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("products.productDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["products"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("products.failedToDeleteProduct"));
    },
  });

  function getStockColor(qty: number, minLevel: number) {
    if (qty === 0) return "text-red-600 bg-red-50";
    if (qty < minLevel) return "text-orange-600 bg-orange-50";
    return "text-green-600 bg-green-50";
  }

  function getStockLabel(qty: number, minLevel: number) {
    if (qty === 0) return t("products.status.outOfStock");
    if (qty < minLevel) return t("products.status.lowStock");
    return t("products.status.inStock");
  }

  function handleDeleteClick(e: React.MouseEvent, product: Product) {
    e.stopPropagation();
    setDeleteTarget(product);
    setDeleteDialogOpen(true);
  }

  function confirmDelete() {
    if (deleteTarget) {
      deleteMutation.mutate(deleteTarget.id);
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("products.title")}
        description={t("products.description")}
      >
        {hasPermission("products.create") && (
          <Link href="/products/new" className={cn(buttonVariants({ variant: "default" }))}>
            <Plus className="size-4" />
            {t("products.addProduct")}
          </Link>
        )}
      </PageHeader>

      <div className="flex items-center gap-2">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
          <Input
            placeholder={t("products.searchPlaceholder")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-8"
          />
        </div>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("products.columns.name")}</TableHead>
              <TableHead>{t("products.columns.sku")}</TableHead>
              <TableHead>{t("products.columns.category")}</TableHead>
              <TableHead>{t("products.columns.price")}</TableHead>
              <TableHead>{t("products.columns.stock")}</TableHead>
              <TableHead>{t("products.columns.status")}</TableHead>
              {hasPermission("products.delete") && (
                <TableHead className="w-10" />
              )}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  {t("products.loadingProducts")}
                </TableCell>
              </TableRow>
            ) : !data?.items?.length ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  {t("products.noProductsFound")}
                </TableCell>
              </TableRow>
            ) : (
              data.items.map((product) => (
                <TableRow
                  key={product.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/products/${product.id}`)}
                >
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {product.sku}
                  </TableCell>
                  <TableCell>{product.category?.name}</TableCell>
                  <TableCell>
                    {new Intl.NumberFormat("en-IN", {
                      style: "currency",
                      currency: "INR",
                    }).format(product.sellingPrice)}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-md px-2 py-0.5 text-xs font-medium ${getStockColor(
                        product.stockQuantity,
                        product.minStockLevel
                      )}`}
                    >
                      {product.stockQuantity}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.stockQuantity === 0
                          ? "destructive"
                          : product.stockQuantity < product.minStockLevel
                          ? "secondary"
                          : "default"
                      }
                    >
                      {getStockLabel(
                        product.stockQuantity,
                        product.minStockLevel
                      )}
                    </Badge>
                  </TableCell>
                  {hasPermission("products.delete") && (
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => handleDeleteClick(e, product)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {t("products.paginationProducts", { page: data.page, totalPages: data.totalPages, total: data.total })}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              {t("common.previous")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= data.totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              {t("common.next")}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("products.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("products.deleteDialog.description", { name: deleteTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
