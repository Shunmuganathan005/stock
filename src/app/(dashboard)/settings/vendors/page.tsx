"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil, Trash2, Plus, Package } from "lucide-react";
import { t } from "@/lib/locales";

interface Place {
  id: string;
  name: string;
  isActive: boolean;
  _count: { vendors: number };
}

interface Product {
  id: string;
  name: string;
  unit: string;
}

interface VendorProduct {
  productId: string;
  rate: number;
  product: Product;
}

interface Vendor {
  id: string;
  name: string;
  isActive: boolean;
  place: Place;
  _count: { products: number };
}

interface VendorDetail extends Vendor {
  products: VendorProduct[];
}

async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch("/api/places");
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch places");
  return json.data;
}

async function fetchVendors(placeId?: string): Promise<Vendor[]> {
  const params = new URLSearchParams();
  if (placeId) params.set("placeId", placeId);
  const res = await fetch(`/api/vendors?${params}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch vendors");
  return json.data;
}

async function fetchVendorDetail(id: string): Promise<VendorDetail> {
  const res = await fetch(`/api/vendors/${id}`);
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch vendor");
  return json.data;
}

async function fetchAllProducts(): Promise<{ items: Product[] }> {
  const res = await fetch("/api/products?pageSize=500");
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch products");
  return json.data;
}

export default function VendorsPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("collections.manage");

  const [selectedPlaceId, setSelectedPlaceId] = useState<string>("");

  // Add dialog
  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPlaceId, setAddPlaceId] = useState("");

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Vendor | null>(null);
  const [editName, setEditName] = useState("");
  const [editPlaceId, setEditPlaceId] = useState("");

  // Manage products dialog
  const [manageOpen, setManageOpen] = useState(false);
  const [manageVendorId, setManageVendorId] = useState<string | null>(null);
  const [newProductId, setNewProductId] = useState("");
  const [newRate, setNewRate] = useState("");
  const [pendingItems, setPendingItems] = useState<VendorProduct[] | null>(null);

  const { data: places = [] } = useQuery<Place[]>({
    queryKey: ["places"],
    queryFn: fetchPlaces,
  });

  const { data: vendors = [], isLoading, isError } = useQuery<Vendor[]>({
    queryKey: ["vendors", selectedPlaceId],
    queryFn: () => fetchVendors(selectedPlaceId || undefined),
  });

  const { data: vendorDetail, isLoading: isLoadingDetail } = useQuery<VendorDetail>({
    queryKey: ["vendor-detail", manageVendorId],
    queryFn: () => fetchVendorDetail(manageVendorId!),
    enabled: !!manageVendorId && manageOpen,
  });

  const { data: productsData } = useQuery({
    queryKey: ["products", "all"],
    queryFn: fetchAllProducts,
    enabled: manageOpen,
  });
  const allProducts: Product[] = productsData?.items ?? [];

  const createMutation = useMutation({
    mutationFn: async ({ name, placeId }: { name: string; placeId: string }) => {
      const res = await fetch("/api/vendors", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, placeId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create vendor");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("vendors.vendorCreatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setAddOpen(false);
      setAddName("");
      setAddPlaceId("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, placeId }: { id: string; name: string; placeId: string }) => {
      const res = await fetch(`/api/vendors/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, placeId }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update vendor");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("vendors.vendorUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/vendors/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to delete vendor");
    },
    onSuccess: () => {
      toast.success(t("vendors.vendorDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const setProductsMutation = useMutation({
    mutationFn: async ({ id, items }: { id: string; items: { productId: string; rate: number }[] }) => {
      const res = await fetch(`/api/vendors/${id}/products`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to save products");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("vendors.productsUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-detail"] });
      setManageOpen(false);
      setManageVendorId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openEditDialog(vendor: Vendor) {
    setEditTarget(vendor);
    setEditName(vendor.name);
    setEditPlaceId(vendor.place.id);
    setEditOpen(true);
  }

  function openManageProducts(vendor: Vendor) {
    setManageVendorId(vendor.id);
    setPendingItems(null);
    setNewProductId("");
    setNewRate("");
    setManageOpen(true);
  }

  function handleDelete(vendor: Vendor) {
    if (window.confirm(t("vendors.deleteConfirm", { name: vendor.name }))) {
      deleteMutation.mutate(vendor.id);
    }
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim() || !addPlaceId) return;
    createMutation.mutate({ name: addName.trim(), placeId: addPlaceId });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editName.trim() || !editPlaceId) return;
    updateMutation.mutate({ id: editTarget.id, name: editName.trim(), placeId: editPlaceId });
  }

  // Manage products helpers
  function getCurrentItems(): VendorProduct[] {
    if (pendingItems !== null) return pendingItems;
    return vendorDetail?.products ?? [];
  }

  function handleAddProductToList() {
    if (!newProductId || !newRate) return;
    const rateNum = parseFloat(newRate);
    if (isNaN(rateNum) || rateNum <= 0) {
      toast.error(t("vendors.invalidRate"));
      return;
    }
    const product = allProducts.find((p) => p.id === newProductId);
    if (!product) return;

    const current = getCurrentItems();
    if (current.some((item) => item.productId === newProductId)) {
      toast.error(t("vendors.productAlreadyAdded"));
      return;
    }
    setPendingItems([...current, { productId: newProductId, rate: rateNum, product }]);
    setNewProductId("");
    setNewRate("");
  }

  function handleRemoveProduct(productId: string) {
    const current = getCurrentItems();
    setPendingItems(current.filter((item) => item.productId !== productId));
  }

  function handleSaveProducts() {
    if (!manageVendorId) return;
    const items = getCurrentItems().map((item) => ({ productId: item.productId, rate: item.rate }));
    setProductsMutation.mutate({ id: manageVendorId, items });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t("vendors.title")} description={t("vendors.description")}>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            {t("vendors.addVendor")}
          </Button>
        )}
      </PageHeader>

      {/* Filter bar */}
      <div className="flex items-center gap-3">
        <Label className="text-sm text-muted-foreground">{t("vendors.filterByPlace")}</Label>
        <Select
          value={selectedPlaceId || "all"}
          onValueChange={(val) => val && setSelectedPlaceId(val === "all" ? "" : val)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder={t("vendors.allPlaces")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("vendors.allPlaces")}</SelectItem>
            {places.map((place) => (
              <SelectItem key={place.id} value={place.id}>
                {place.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("vendors.columns.name")}</TableHead>
              <TableHead>{t("vendors.columns.place")}</TableHead>
              <TableHead>{t("vendors.columns.products")}</TableHead>
              <TableHead>{t("vendors.columns.status")}</TableHead>
              {canManage && <TableHead className="w-32 text-right">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center">
                  {t("vendors.loadingVendors")}
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center text-destructive">
                  {t("vendors.failedToLoad")}
                </TableCell>
              </TableRow>
            ) : vendors.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 5 : 4} className="py-8 text-center text-muted-foreground">
                  {t("vendors.noVendorsFound")}
                </TableCell>
              </TableRow>
            ) : (
              vendors.map((vendor) => (
                <TableRow key={vendor.id}>
                  <TableCell className="font-medium">{vendor.name}</TableCell>
                  <TableCell>{vendor.place.name}</TableCell>
                  <TableCell>{vendor._count.products}</TableCell>
                  <TableCell>
                    <Badge variant={vendor.isActive ? "default" : "secondary"}>
                      {vendor.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          title={t("vendors.manageProducts")}
                          onClick={() => openManageProducts(vendor)}
                        >
                          <Package className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(vendor)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(vendor)}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  )}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Vendor Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vendors.addVendor")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-vendor-name">{t("vendors.nameLabel")}</Label>
              <Input
                id="add-vendor-name"
                placeholder={t("vendors.namePlaceholder")}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("vendors.placeLabel")}</Label>
              <Select value={addPlaceId} onValueChange={(val) => val && setAddPlaceId(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("vendors.placePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending || !addPlaceId}>
                {createMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Vendor Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("vendors.editVendor")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-vendor-name">{t("vendors.nameLabel")}</Label>
              <Input
                id="edit-vendor-name"
                placeholder={t("vendors.namePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label>{t("vendors.placeLabel")}</Label>
              <Select value={editPlaceId} onValueChange={(val) => val && setEditPlaceId(val)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("vendors.placePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {places.map((place) => (
                    <SelectItem key={place.id} value={place.id}>
                      {place.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={updateMutation.isPending || !editPlaceId}>
                {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Manage Products Dialog */}
      <Dialog open={manageOpen} onOpenChange={(open) => {
        setManageOpen(open);
        if (!open) {
          setManageVendorId(null);
          setPendingItems(null);
          setNewProductId("");
          setNewRate("");
        }
      }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{t("vendors.manageProducts")}</DialogTitle>
          </DialogHeader>

          {isLoadingDetail ? (
            <div className="py-4 text-center text-muted-foreground">{t("common.loading")}</div>
          ) : (
            <div className="space-y-4">
              {/* Current products */}
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{t("vendors.columns.product")}</TableHead>
                      <TableHead>{t("vendors.columns.rate")}</TableHead>
                      <TableHead className="w-12" />
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getCurrentItems().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={3} className="py-4 text-center text-muted-foreground">
                          {t("vendors.noProductsAssigned")}
                        </TableCell>
                      </TableRow>
                    ) : (
                      getCurrentItems().map((item) => (
                        <TableRow key={item.productId}>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell>
                            {new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(item.rate)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              onClick={() => handleRemoveProduct(item.productId)}
                            >
                              <Trash2 className="size-4 text-destructive" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Add new product row */}
              <div className="flex items-end gap-2">
                <div className="flex-1 space-y-1">
                  <Label className="text-xs">{t("vendors.productLabel")}</Label>
                  <Select value={newProductId} onValueChange={(val) => val && setNewProductId(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("vendors.selectProduct")} />
                    </SelectTrigger>
                    <SelectContent>
                      {allProducts
                        .filter((p) => !getCurrentItems().some((item) => item.productId === p.id))
                        .map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-28 space-y-1">
                  <Label className="text-xs">{t("vendors.rateLabel")}</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="0.00"
                    value={newRate}
                    onChange={(e) => setNewRate(e.target.value)}
                  />
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleAddProductToList}
                  disabled={!newProductId || !newRate}
                >
                  <Plus className="size-4" />
                </Button>
              </div>
            </div>
          )}

          <DialogFooter>
            <DialogClose render={<Button variant="outline" type="button" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button onClick={handleSaveProducts} disabled={setProductsMutation.isPending}>
              {setProductsMutation.isPending ? t("common.saving") : t("common.save")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
