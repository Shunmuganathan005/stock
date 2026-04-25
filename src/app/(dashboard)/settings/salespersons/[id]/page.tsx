"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { ChevronLeft, Pencil, Phone } from "lucide-react";
import { t } from "@/lib/locales";

interface Place {
  id: string;
  name: string;
}

interface SalespersonPlace {
  place: Place;
}

interface Salesperson {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  places: SalespersonPlace[];
}

interface HistoryItem {
  id: string;
  quantity: number;
  rate: number;
  amount: number;
  collection: { date: string };
  vendor: { id: string; name: string; place: { id: string; name: string } };
  product: { id: string; name: string; unit: string };
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-IN");
}

function toDateInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getDefaultDates(): { start: string; end: string } {
  const end = new Date();
  const start = new Date();
  start.setDate(end.getDate() - 6);
  return { start: toDateInputValue(start), end: toDateInputValue(end) };
}

export default function SalespersonDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("collections.manage");

  const defaultDates = getDefaultDates();
  const [startDate, setStartDate] = useState(defaultDates.start);
  const [endDate, setEndDate] = useState(defaultDates.end);
  const [appliedStart, setAppliedStart] = useState(defaultDates.start);
  const [appliedEnd, setAppliedEnd] = useState(defaultDates.end);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Place assignment state
  const [checkedPlaceIds, setCheckedPlaceIds] = useState<Set<string>>(new Set());

  const { data: salesperson, isLoading, isError } = useQuery<Salesperson>({
    queryKey: ["salesperson", id],
    queryFn: async () => {
      const res = await fetch(`/api/salespersons/${id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch salesperson");
      return json.data;
    },
    enabled: !!id,
  });

  const { data: allPlaces = [] } = useQuery<Place[]>({
    queryKey: ["places"],
    queryFn: async () => {
      const res = await fetch("/api/places");
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch places");
      return json.data;
    },
  });

  const { data: history = [], isLoading: isLoadingHistory } = useQuery<HistoryItem[]>({
    queryKey: ["salesperson-history", id, appliedStart, appliedEnd],
    queryFn: async () => {
      const params = new URLSearchParams({ startDate: appliedStart, endDate: appliedEnd });
      const res = await fetch(`/api/salespersons/${id}/history?${params}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to fetch history");
      return json.data;
    },
    enabled: !!id,
  });

  // Sync checked places when salesperson loads
  useEffect(() => {
    if (salesperson) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCheckedPlaceIds(new Set(salesperson.places.map((sp) => sp.place.id)));
    }
  }, [salesperson]);

  const updateMutation = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      const res = await fetch(`/api/salespersons/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update salesperson");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("salespersons.salespersonUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["salesperson", id] });
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
      setEditOpen(false);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const savePlacesMutation = useMutation({
    mutationFn: async (placeIds: string[]) => {
      const res = await fetch(`/api/salespersons/${id}/places`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ placeIds }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to save places");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("salespersons.placesUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["salesperson", id] });
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openEditDialog() {
    if (!salesperson) return;
    setEditName(salesperson.name);
    setEditPhone(salesperson.phone ?? "");
    setEditOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editName.trim()) return;
    updateMutation.mutate({ name: editName.trim(), phone: editPhone.trim() });
  }

  function togglePlace(placeId: string) {
    setCheckedPlaceIds((prev) => {
      const next = new Set(prev);
      if (next.has(placeId)) {
        next.delete(placeId);
      } else {
        next.add(placeId);
      }
      return next;
    });
  }

  function handleSavePlaces() {
    savePlacesMutation.mutate([...checkedPlaceIds]);
  }

  function handleApplyDates() {
    setAppliedStart(startDate);
    setAppliedEnd(endDate);
  }

  // Group history by date
  const groupedHistory = history.reduce<Record<string, HistoryItem[]>>((acc, item) => {
    const dateKey = item.collection.date.split("T")[0];
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(item);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedHistory).sort().reverse();

  const grandTotal = history.reduce((sum, item) => sum + item.amount, 0);

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-muted-foreground">{t("salespersons.loadingSalesperson")}</div>
      </div>
    );
  }

  if (isError || !salesperson) {
    return (
      <div className="p-6">
        <div className="text-destructive">{t("salespersons.failedToLoad")}</div>
      </div>
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          className="mb-2 -ml-1"
          onClick={() => router.push("/settings/salespersons")}
        >
          <ChevronLeft className="mr-1 size-4" />
          {t("salespersons.backToSalespersons")}
        </Button>
        <PageHeader title={salesperson.name} description={salesperson.phone || undefined}>
          {canManage && (
            <Button variant="outline" onClick={openEditDialog}>
              <Pencil className="mr-1.5 size-4" />
              {t("common.edit")}
            </Button>
          )}
        </PageHeader>
        {salesperson.phone && (
          <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
            <Phone className="size-3.5" />
            {salesperson.phone}
          </p>
        )}
      </div>

      {/* Assigned Places */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t("salespersons.assignedPlaces")}</h3>
        {allPlaces.length === 0 ? (
          <p className="text-sm text-muted-foreground">{t("salespersons.noPlacesAvailable")}</p>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-2">
              {allPlaces.map((place) => (
                <label
                  key={place.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md border px-3 py-2 hover:bg-muted/50"
                >
                  <input
                    type="checkbox"
                    checked={checkedPlaceIds.has(place.id)}
                    onChange={() => togglePlace(place.id)}
                    className="size-4 rounded"
                    disabled={!canManage}
                  />
                  <span className="text-sm font-medium">{place.name}</span>
                </label>
              ))}
            </div>
            {canManage && (
              <Button
                onClick={handleSavePlaces}
                disabled={savePlacesMutation.isPending}
              >
                {savePlacesMutation.isPending ? t("common.saving") : t("salespersons.savePlaces")}
              </Button>
            )}
          </div>
        )}
      </section>

      {/* Collection History */}
      <section className="space-y-4">
        <h3 className="text-lg font-semibold">{t("salespersons.collectionHistory")}</h3>

        {/* Date range */}
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <Label htmlFor="start-date" className="text-xs">{t("salespersons.startDate")}</Label>
            <Input
              id="start-date"
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="end-date" className="text-xs">{t("salespersons.endDate")}</Label>
            <Input
              id="end-date"
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-40"
            />
          </div>
          <Button variant="secondary" onClick={handleApplyDates}>
            {t("salespersons.applyDates")}
          </Button>
        </div>

        {isLoadingHistory ? (
          <div className="py-4 text-center text-muted-foreground">{t("common.loading")}</div>
        ) : sortedDates.length === 0 ? (
          <div className="py-4 text-center text-muted-foreground">{t("salespersons.noHistoryFound")}</div>
        ) : (
          <div className="space-y-4 rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("salespersons.historyColumns.date")}</TableHead>
                  <TableHead>{t("salespersons.historyColumns.vendor")}</TableHead>
                  <TableHead>{t("salespersons.historyColumns.place")}</TableHead>
                  <TableHead>{t("salespersons.historyColumns.product")}</TableHead>
                  <TableHead className="text-right">{t("salespersons.historyColumns.qty")}</TableHead>
                  <TableHead className="text-right">{t("salespersons.historyColumns.rate")}</TableHead>
                  <TableHead className="text-right">{t("salespersons.historyColumns.amount")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedDates.map((dateKey) => {
                  const items = groupedHistory[dateKey];
                  const dayTotal = items.reduce((sum, item) => sum + item.amount, 0);
                  return (
                    <React.Fragment key={dateKey}>
                      {items.map((item, idx) => (
                        <TableRow key={item.id}>
                          <TableCell className="text-muted-foreground">
                            {idx === 0 ? formatDate(item.collection.date) : ""}
                          </TableCell>
                          <TableCell>{item.vendor.name}</TableCell>
                          <TableCell>{item.vendor.place.name}</TableCell>
                          <TableCell>{item.product.name}</TableCell>
                          <TableCell className="text-right">{item.quantity}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.rate)}</TableCell>
                          <TableCell className="text-right">{formatCurrency(item.amount)}</TableCell>
                        </TableRow>
                      ))}
                      <TableRow className="bg-muted/30 font-medium">
                        <TableCell colSpan={6} className="text-right text-xs text-muted-foreground">
                          {t("salespersons.daySubtotal", { date: formatDate(dateKey) })}
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(dayTotal)}</TableCell>
                      </TableRow>
                    </React.Fragment>
                  );
                })}
                <TableRow className="border-t-2 bg-muted/50 font-semibold">
                  <TableCell colSpan={6} className="text-right">
                    {t("salespersons.grandTotal")}
                  </TableCell>
                  <TableCell className="text-right">{formatCurrency(grandTotal)}</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("salespersons.editSalesperson")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sp-name-detail">{t("salespersons.nameLabel")}</Label>
              <Input
                id="edit-sp-name-detail"
                placeholder={t("salespersons.namePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sp-phone-detail">
                {t("salespersons.phoneLabel")}
                <span className="ml-1 text-xs text-muted-foreground">({t("common.optional")})</span>
              </Label>
              <Input
                id="edit-sp-phone-detail"
                placeholder={t("salespersons.phonePlaceholder")}
                value={editPhone}
                onChange={(e) => setEditPhone(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
