"use client";

import { use, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, Loader2, X } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { usePermissions } from "@/hooks/use-permissions";
import { t } from "@/lib/locales";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

interface CollectionItem {
  id: string;
  quantity: number;
  rate: number;
  amount: number;
  vendor: { id: string; name: string; place: { id: string; name: string } };
  product: { id: string; name: string; unit: string };
}

interface CollectionDetail {
  id: string;
  date: string;
  salesperson: { id: string; name: string };
  totalQuantity: number;
  totalAmount: number;
  items: CollectionItem[];
}

interface EditLineItem {
  itemId: string;
  placeId: string;
  placeName: string;
  vendorId: string;
  vendorName: string;
  productId: string;
  productName: string;
  unit: string;
  rate: number;
  quantity: number;
  amount: number;
}

function buildEditItems(collection: CollectionDetail): EditLineItem[] {
  return collection.items.map((item) => ({
    itemId: item.id,
    placeId: item.vendor.place.id,
    placeName: item.vendor.place.name,
    vendorId: item.vendor.id,
    vendorName: item.vendor.name,
    productId: item.product.id,
    productName: item.product.name,
    unit: item.product.unit,
    rate: item.rate,
    quantity: item.quantity,
    amount: item.amount,
  }));
}

export default function CollectionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [editMode, setEditMode] = useState(false);
  const [editItems, setEditItems] = useState<EditLineItem[]>([]);
  const [deletingOpen, setDeletingOpen] = useState(false);

  const { data: collection, isLoading, error } = useQuery<CollectionDetail>({
    queryKey: ["collection", id],
    queryFn: async () => {
      const res = await fetch(`/api/collections/${id}`);
      if (!res.ok) throw new Error("Failed to fetch collection");
      const json = await res.json();
      return json.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (payload: {
      date: string;
      salespersonId: string;
      items: { vendorId: string; productId: string; quantity: number; rate: number }[];
    }) => {
      const res = await fetch(`/api/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to update collection");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("collections.savedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["collection", id] });
      queryClient.invalidateQueries({ queryKey: ["collections"] });
      setEditMode(false);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/collections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json().catch(() => null);
        throw new Error(json?.error ?? "Failed to delete collection");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(t("collections.deletedSuccess"));
      router.push("/collections");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function startEdit() {
    if (!collection) return;
    setEditItems(buildEditItems(collection));
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setEditItems([]);
  }

  function updateEditItem(
    itemId: string,
    field: "rate" | "quantity",
    value: number
  ) {
    setEditItems((prev) =>
      prev.map((item) => {
        if (item.itemId === itemId) {
          const updated = { ...item, [field]: value };
          updated.amount = updated.quantity * updated.rate;
          return updated;
        }
        return item;
      })
    );
  }

  function handleUpdate() {
    if (!collection) return;
    const submitItems = editItems.filter((i) => i.quantity > 0);
    if (submitItems.length === 0) {
      toast.error("Please enter at least one quantity.");
      return;
    }
    updateMutation.mutate({
      date: collection.date,
      salespersonId: collection.salesperson.id,
      items: submitItems.map((i) => ({
        vendorId: i.vendorId,
        productId: i.productId,
        quantity: i.quantity,
        rate: i.rate,
      })),
    });
  }

  // Group items by place → vendor for display
  const groupedItems = useMemo(() => {
    const items = editMode ? editItems : (collection?.items ?? []);
    const placeMap = new Map<
      string,
      {
        placeName: string;
        vendors: Map<
          string,
          {
            vendorName: string;
            items: (CollectionItem | EditLineItem)[];
          }
        >;
      }
    >();

    for (const item of items) {
      const placeId = editMode
        ? (item as EditLineItem).placeId
        : (item as CollectionItem).vendor.place.id;
      const placeName = editMode
        ? (item as EditLineItem).placeName
        : (item as CollectionItem).vendor.place.name;
      const vendorId = editMode
        ? (item as EditLineItem).vendorId
        : (item as CollectionItem).vendor.id;
      const vendorName = editMode
        ? (item as EditLineItem).vendorName
        : (item as CollectionItem).vendor.name;

      if (!placeMap.has(placeId)) {
        placeMap.set(placeId, { placeName, vendors: new Map() });
      }
      const place = placeMap.get(placeId)!;
      if (!place.vendors.has(vendorId)) {
        place.vendors.set(vendorId, { vendorName, items: [] });
      }
      place.vendors.get(vendorId)!.items.push(item as CollectionItem | EditLineItem);
    }
    return placeMap;
  }, [collection, editItems, editMode]);

  const editTotalQty = editItems.reduce((s, i) => s + i.quantity, 0);
  const editTotalAmount = editItems.reduce((s, i) => s + i.amount, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <p className="text-muted-foreground">Collection not found.</p>
        <Link href="/collections" className={cn(buttonVariants({ variant: "outline" }))}>
          {t("collections.back")}
        </Link>
      </div>
    );
  }

  const canEdit = hasPermission("collections.create");

  return (
    <div className="flex flex-col gap-6 p-6">
      <PageHeader title={t("collections.title")}>
        <div className="flex gap-2">
          <Link href="/collections" className={cn(buttonVariants({ variant: "outline" }))}>
            <ArrowLeft data-icon="inline-start" />
            {t("collections.back")}
          </Link>
          {canEdit && !editMode && (
            <>
              <Button variant="outline" onClick={startEdit}>
                {t("collections.editEntry")}
              </Button>
              <Button
                variant="destructive"
                onClick={() => setDeletingOpen(true)}
              >
                {t("collections.deleteEntry")}
              </Button>
            </>
          )}
          {editMode && (
            <>
              <Button variant="outline" onClick={cancelEdit}>
                {t("common.cancel")}
              </Button>
              <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
                {updateMutation.isPending && (
                  <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
                )}
                {t("collections.submit")}
              </Button>
            </>
          )}
        </div>
      </PageHeader>

      {/* Header info */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("collections.date")}</p>
              <p className="font-medium">{collection.date}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("collections.salesperson")}</p>
              <p className="font-medium">{collection.salesperson.name}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("collections.totalQty")}</p>
              <p className="font-medium">
                {editMode ? editTotalQty : collection.totalQuantity}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t("collections.totalAmount")}</p>
              <p className="font-medium">
                ₹{(editMode ? editTotalAmount : collection.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Items grouped by place → vendor */}
      {Array.from(groupedItems.entries()).map(([placeId, { placeName, vendors }]) => (
        <Card key={placeId}>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">
              {t("collections.place")}: {placeName}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Array.from(vendors.entries()).map(([vendorId, { vendorName, items }]) => {
              const vendorTotal = items.reduce((s, i) => s + i.amount, 0);
              return (
                <div key={vendorId} className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {t("collections.vendor")}: {vendorName}
                  </p>
                  <div className="rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("collections.product")}</TableHead>
                          <TableHead>{t("collections.unit")}</TableHead>
                          <TableHead className="text-right">{t("collections.qty")}</TableHead>
                          <TableHead className="text-right">{t("collections.rate")}</TableHead>
                          <TableHead className="text-right">{t("collections.amount")}</TableHead>
                          {editMode && <TableHead className="w-10" />}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {items.map((item) => {
                          if (editMode) {
                            const ei = item as EditLineItem;
                            return (
                              <TableRow key={ei.itemId}>
                                <TableCell className="font-medium">
                                  {ei.productName}
                                </TableCell>
                                <TableCell>{ei.unit}</TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    value={ei.quantity}
                                    onChange={(e) =>
                                      updateEditItem(
                                        ei.itemId,
                                        "quantity",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-20 h-7 text-sm ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right">
                                  <Input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={ei.rate}
                                    onChange={(e) =>
                                      updateEditItem(
                                        ei.itemId,
                                        "rate",
                                        parseFloat(e.target.value) || 0
                                      )
                                    }
                                    className="w-24 h-7 text-sm ml-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{ei.amount.toFixed(2)}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    variant="ghost"
                                    size="icon-sm"
                                    onClick={() =>
                                      setEditItems((prev) =>
                                        prev.filter((x) => x.itemId !== ei.itemId)
                                      )
                                    }
                                  >
                                    <X className="size-4 text-muted-foreground" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          } else {
                            const ci = item as CollectionItem;
                            return (
                              <TableRow key={ci.id}>
                                <TableCell className="font-medium">
                                  {ci.product.name}
                                </TableCell>
                                <TableCell>{ci.product.unit}</TableCell>
                                <TableCell className="text-right">
                                  {ci.quantity}
                                </TableCell>
                                <TableCell className="text-right">
                                  ₹{ci.rate.toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right font-medium">
                                  ₹{ci.amount.toFixed(2)}
                                </TableCell>
                              </TableRow>
                            );
                          }
                        })}
                        {/* Vendor subtotal */}
                        <TableRow className="bg-muted/30">
                          <TableCell
                            colSpan={4}
                            className="text-right text-sm text-muted-foreground font-medium"
                          >
                            {t("collections.subtotal")}
                          </TableCell>
                          <TableCell className="text-right font-semibold">
                            ₹{vendorTotal.toFixed(2)}
                          </TableCell>
                          {editMode && <TableCell />}
                        </TableRow>
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}

      {/* Grand total (read-only mode) */}
      {!editMode && (
        <div className="flex justify-end">
          <div className="w-64 space-y-2 rounded-lg border p-4">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t("collections.totalQty")}</span>
              <span>{collection.totalQuantity}</span>
            </div>
            <Separator />
            <div className="flex justify-between font-semibold">
              <span>{t("collections.grandTotal")}</span>
              <span>₹{collection.totalAmount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Delete confirmation dialog */}
      <Dialog open={deletingOpen} onOpenChange={setDeletingOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("collections.deleteEntry")}</DialogTitle>
            <DialogDescription>{t("collections.confirmDelete")}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeletingOpen(false)}>
              {t("common.cancel")}
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && (
                <Loader2 className="size-4 animate-spin" data-icon="inline-start" />
              )}
              {t("common.delete")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
