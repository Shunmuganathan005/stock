"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
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
import { Pencil, Plus, ChevronRight, Trash2 } from "lucide-react";
import { t } from "@/lib/locales";

interface Salesperson {
  id: string;
  name: string;
  phone: string;
  isActive: boolean;
  _count: { places: number };
}

async function fetchSalespersons(): Promise<Salesperson[]> {
  const res = await fetch("/api/salespersons");
  const json = await res.json();
  if (!json.success) throw new Error(json.error ?? "Failed to fetch salespersons");
  return json.data;
}

export default function SalespersonsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();
  const canManage = hasPermission("collections.manage");

  const [addOpen, setAddOpen] = useState(false);
  const [addName, setAddName] = useState("");
  const [addPhone, setAddPhone] = useState("");

  const [editOpen, setEditOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Salesperson | null>(null);
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");

  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const { data: salespersons = [], isLoading, isError } = useQuery<Salesperson[]>({
    queryKey: ["salespersons"],
    queryFn: fetchSalespersons,
  });

  const createMutation = useMutation({
    mutationFn: async ({ name, phone }: { name: string; phone: string }) => {
      const res = await fetch("/api/salespersons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone: phone || undefined }),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to create salesperson");
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("salespersons.salespersonCreatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
      setAddOpen(false);
      setAddName("");
      setAddPhone("");
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, name, phone }: { id: string; name: string; phone: string }) => {
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
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
      setEditOpen(false);
      setEditTarget(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/salespersons/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error ?? "Failed to delete salesperson");
    },
    onSuccess: () => {
      toast.success(t("salespersons.salespersonDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["salespersons"] });
      setDeleteConfirmId(null);
    },
    onError: (error: Error) => toast.error(error.message),
  });

  function openEditDialog(sp: Salesperson, e: React.MouseEvent) {
    e.stopPropagation();
    setEditTarget(sp);
    setEditName(sp.name);
    setEditPhone(sp.phone ?? "");
    setEditOpen(true);
  }

  function handleAddSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!addName.trim()) return;
    createMutation.mutate({ name: addName.trim(), phone: addPhone.trim() });
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    updateMutation.mutate({ id: editTarget.id, name: editName.trim(), phone: editPhone.trim() });
  }

  return (
    <div className="space-y-6 p-6">
      <PageHeader title={t("salespersons.title")} description={t("salespersons.description")}>
        {canManage && (
          <Button onClick={() => setAddOpen(true)}>
            <Plus className="mr-1.5 size-4" />
            {t("salespersons.addSalesperson")}
          </Button>
        )}
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("salespersons.columns.name")}</TableHead>
              <TableHead>{t("salespersons.columns.phone")}</TableHead>
              <TableHead>{t("salespersons.columns.places")}</TableHead>
              <TableHead>{t("salespersons.columns.status")}</TableHead>
              <TableHead className="w-24 text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center">
                  {t("salespersons.loadingSalespersons")}
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-destructive">
                  {t("salespersons.failedToLoad")}
                </TableCell>
              </TableRow>
            ) : salespersons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                  {t("salespersons.noSalespersonsFound")}
                </TableCell>
              </TableRow>
            ) : (
              salespersons.map((sp) => (
                <TableRow
                  key={sp.id}
                  className="cursor-pointer"
                  onClick={() => router.push(`/settings/salespersons/${sp.id}`)}
                >
                  <TableCell className="font-medium">{sp.name}</TableCell>
                  <TableCell className="text-muted-foreground">{sp.phone || "\u2014"}</TableCell>
                  <TableCell>{sp._count.places}</TableCell>
                  <TableCell>
                    <Badge variant={sp.isActive ? "default" : "secondary"}>
                      {sp.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      {canManage && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => openEditDialog(sp, e)}
                          >
                            <Pencil className="size-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(sp.id);
                            }}
                            disabled={deleteMutation.isPending}
                          >
                            <Trash2 className="size-4 text-destructive" />
                          </Button>
                        </>
                      )}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/settings/salespersons/${sp.id}`);
                        }}
                      >
                        <ChevronRight className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add Salesperson Dialog */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("salespersons.addSalesperson")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="add-sp-name">{t("salespersons.nameLabel")}</Label>
              <Input
                id="add-sp-name"
                placeholder={t("salespersons.namePlaceholder")}
                value={addName}
                onChange={(e) => setAddName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="add-sp-phone">
                {t("salespersons.phoneLabel")}
                <span className="ml-1 text-xs text-muted-foreground">({t("common.optional")})</span>
              </Label>
              <Input
                id="add-sp-phone"
                placeholder={t("salespersons.phonePlaceholder")}
                value={addPhone}
                onChange={(e) => setAddPhone(e.target.value)}
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

      {/* Edit Salesperson Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("salespersons.editSalesperson")}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-sp-name">{t("salespersons.nameLabel")}</Label>
              <Input
                id="edit-sp-name"
                placeholder={t("salespersons.namePlaceholder")}
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-sp-phone">
                {t("salespersons.phoneLabel")}
                <span className="ml-1 text-xs text-muted-foreground">({t("common.optional")})</span>
              </Label>
              <Input
                id="edit-sp-phone"
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

      {/* Delete Confirm Dialog */}
      {(() => {
        const target = salespersons.find((sp) => sp.id === deleteConfirmId);
        return (
          <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{t("common.confirmDelete")}</DialogTitle>
              </DialogHeader>
              <p className="text-sm text-muted-foreground">
                {target ? t("salespersons.deleteConfirm", { name: target.name }) : ""}
              </p>
              <DialogFooter>
                <DialogClose render={<Button variant="outline" type="button" />}>
                  {t("common.cancel")}
                </DialogClose>
                <Button
                  variant="destructive"
                  disabled={deleteMutation.isPending}
                  onClick={() => deleteConfirmId && deleteMutation.mutate(deleteConfirmId)}
                >
                  {deleteMutation.isPending ? t("common.deleting") : t("common.delete")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        );
      })()}
    </div>
  );
}
