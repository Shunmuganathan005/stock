"use client";

import { useState } from "react";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus } from "lucide-react";
import { t } from "@/lib/locales";

interface Category {
  id: string;
  name: string;
  description: string | null;
  isActive: boolean;
  _count?: { products: number };
}

export default function CategoriesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<Category | null>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);

  const { data: categories, isLoading } = useQuery<Category[]>({
    queryKey: ["categories"],
    queryFn: async () => {
      const res = await fetch("/api/categories");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: { name: string; description: string }) => {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("categories.categoryCreatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setNewName("");
      setNewDescription("");
    },
    onError: (error: Error) => {
      toast.error(error.message || t("categories.failedToCreateCategory"));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description: string };
    }) => {
      const res = await fetch(`/api/categories/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("categories.categoryUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setEditDialogOpen(false);
      setEditTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("categories.failedToUpdateCategory"));
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("categories.categoryDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["categories"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("categories.failedToDeleteCategory"));
    },
  });

  function handleAddCategory(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    createMutation.mutate({ name: newName.trim(), description: newDescription.trim() });
  }

  function openEditDialog(category: Category) {
    setEditTarget(category);
    setEditName(category.name);
    setEditDescription(category.description ?? "");
    setEditDialogOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget || !editName.trim()) return;
    updateMutation.mutate({
      id: editTarget.id,
      data: { name: editName.trim(), description: editDescription.trim() },
    });
  }

  function openDeleteDialog(category: Category) {
    setDeleteTarget(category);
    setDeleteDialogOpen(true);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("categories.title")}
        description={t("categories.description")}
      />

      {hasPermission("products.create") && (
        <form
          onSubmit={handleAddCategory}
          className="flex items-end gap-3 rounded-lg border p-4"
        >
          <div className="flex-1 space-y-2">
            <Label htmlFor="cat-name">{t("common.name")}</Label>
            <Input
              id="cat-name"
              placeholder={t("categories.namePlaceholder")}
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
          </div>
          <div className="flex-1 space-y-2">
            <Label htmlFor="cat-desc">{t("common.description")}</Label>
            <Input
              id="cat-desc"
              placeholder={t("categories.descriptionPlaceholder")}
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
            />
          </div>
          <Button type="submit" disabled={createMutation.isPending}>
            <Plus className="size-4" />
            {createMutation.isPending ? t("common.adding") : t("common.add")}
          </Button>
        </form>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("common.name")}</TableHead>
              <TableHead>{t("common.description")}</TableHead>
              <TableHead className="w-24 text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center py-8">
                  {t("categories.loadingCategories")}
                </TableCell>
              </TableRow>
            ) : !categories?.length ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("categories.noCategoriesFound")}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium">{category.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.description || "-"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      {hasPermission("products.edit") && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil className="size-4" />
                        </Button>
                      )}
                      {hasPermission("products.delete") && (
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openDeleteDialog(category)}
                        >
                          <Trash2 className="size-4 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("categories.editDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("categories.editDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">{t("common.name")}</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-desc">{t("common.description")}</Label>
              <Input
                id="edit-desc"
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
              />
            </div>
            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? t("common.saving") : t("common.saveChanges")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("categories.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("categories.deleteDialog.description", { name: deleteTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
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
