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
import { Pencil, Trash2, Plus } from "lucide-react";
import { t } from "@/lib/locales";

interface Place {
  id: string;
  name: string;
  isActive: boolean;
  _count: { vendors: number };
}

async function fetchPlaces(): Promise<Place[]> {
  const res = await fetch("/api/places");
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch places");
  return json.data;
}

export default function PlacesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Place | null>(null);
  const [editName, setEditName] = useState("");

  const { data: places = [], isLoading, isError } = useQuery<Place[]>({
    queryKey: ["places"],
    queryFn: fetchPlaces,
  });

  const createMutation = useMutation({
    mutationFn: async (name: string) => {
      const res = await fetch("/api/places", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create place");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("places.placeCreatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["places"] });
      setAddOpen(false);
      setAddName("");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const res = await fetch(`/api/places/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to update place");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("places.placeUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["places"] });
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/places/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to delete place");
    },
    onSuccess: () => {
      toast.success(t("places.placeDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["places"] });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  function openEditDialog(place: Place) {
    setEditTarget(place);
    setEditName(place.name);
    setEditOpen(true);
  }

  function handleDelete(place: Place) {
    if (window.confirm(t("places.deleteConfirm", { name: place.name }))) {
      deleteMutation.mutate(place.id);
    }
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    createMutation.mutate(addName.trim());
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    updateMutation.mutate({ id: editTarget.id, name: editName.trim() });
  }

  const canManage = hasPermission("collections.manage");

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t("places.title")} description={t("places.description")}>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            {t("places.addPlace")}
          </Button>
        )}
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("places.columns.name")}</TableHead>
              <TableHead>{t("places.columns.vendors")}</TableHead>
              <TableHead>{t("places.columns.status")}</TableHead>
              {canManage && <TableHead className="w-24 text-right">{t("common.actions")}</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="py-8 text-center">
                  {t("places.loadingPlaces")}
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="py-8 text-center text-destructive">
                  {t("places.failedToLoad")}
                </TableCell>
              </TableRow>
            ) : places.length === 0 ? (
              <TableRow>
                <TableCell colSpan={canManage ? 4 : 3} className="py-8 text-center text-muted-foreground">
                  {t("places.noPlacesFound")}
                </TableCell>
              </TableRow>
            ) : (
              places.map((place) => (
                <TableRow key={place.id}>
                  <TableCell className="font-medium">{place.name}</TableCell>
                  <TableCell>{place._count.vendors}</TableCell>
                  <TableCell>
                    <Badge variant={place.isActive ? "default" : "secondary"}>
                      {place.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  {canManage && (
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(place)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleDelete(place)}
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

      {/* Add Place Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("places.addPlace")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-place-name">{t("places.nameLabel")}</Label>
              <Input
                id="add-place-name"
                placeholder={t("places.namePlaceholder")}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" type="button" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending ? t("common.saving") : t("common.save")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Place Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("places.editPlace")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-place-name">{t("places.nameLabel")}</Label>
              <Input
                id="edit-place-name"
                placeholder={t("places.namePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
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
