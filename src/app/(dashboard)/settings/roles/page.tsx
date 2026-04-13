"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/locales";
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
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, Shield } from "lucide-react";

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
}

interface RolePermission {
  roleId: string;
  permissionId: string;
  permission: Permission;
}

interface Role {
  id: string;
  name: string;
  description: string;
  _count?: { rolePermissions: number };
  rolePermissions?: RolePermission[];
  users?: unknown[];
}

export default function RolesPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  // Dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<"add" | "edit">("add");
  const [editTarget, setEditTarget] = useState<Role | null>(null);

  // Form state
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<
    Set<string>
  >(new Set());

  // Delete dialog
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Role | null>(null);

  // Fetch roles
  const {
    data: roles,
    isLoading: rolesLoading,
    isError: rolesError,
  } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  // Fetch all permissions
  const { data: permissions } = useQuery<Permission[]>({
    queryKey: ["permissions"],
    queryFn: async () => {
      const res = await fetch("/api/permissions");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
  });

  // Fetch single role details for editing (to get permission IDs)
  const { data: editRoleDetails } = useQuery<Role>({
    queryKey: ["role", editTarget?.id],
    queryFn: async () => {
      const res = await fetch(`/api/roles/${editTarget!.id}`);
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: !!editTarget && dialogMode === "edit",
  });

  // When edit role details load, populate the selected permission IDs
  useEffect(() => {
    if (editRoleDetails && dialogMode === "edit") {
      const permIds = new Set(
        editRoleDetails.rolePermissions?.map((rp) => rp.permissionId) ?? []
      );
      setSelectedPermissionIds(permIds);
    }
  }, [editRoleDetails, dialogMode]);

  // Create role mutation
  const createMutation = useMutation({
    mutationFn: async (data: {
      name: string;
      description: string;
      permissionIds: string[];
    }) => {
      const res = await fetch("/api/roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("settings.roles.roleCreatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.roles.failedToCreateRole"));
    },
  });

  // Update role mutation
  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; description: string; permissionIds: string[] };
    }) => {
      const res = await fetch(`/api/roles/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("settings.roles.roleUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      closeDialog();
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.roles.failedToUpdateRole"));
    },
  });

  // Delete role mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/roles/${id}`, { method: "DELETE" });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json;
    },
    onSuccess: () => {
      toast.success(t("settings.roles.roleDeletedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["roles"] });
      setDeleteDialogOpen(false);
      setDeleteTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.roles.failedToDeleteRole"));
    },
  });

  function openAddDialog() {
    setDialogMode("add");
    setEditTarget(null);
    setFormName("");
    setFormDescription("");
    setSelectedPermissionIds(new Set());
    setDialogOpen(true);
  }

  function openEditDialog(role: Role) {
    setDialogMode("edit");
    setEditTarget(role);
    setFormName(role.name);
    setFormDescription(role.description || "");
    // Permission IDs will be populated from the editRoleDetails query via useEffect
    setSelectedPermissionIds(new Set());
    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditTarget(null);
    setFormName("");
    setFormDescription("");
    setSelectedPermissionIds(new Set());
  }

  function openDeleteDialog(role: Role) {
    setDeleteTarget(role);
    setDeleteDialogOpen(true);
  }

  function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formName.trim()) return;

    const payload = {
      name: formName.trim(),
      description: formDescription.trim(),
      permissionIds: Array.from(selectedPermissionIds),
    };

    if (dialogMode === "edit" && editTarget) {
      updateMutation.mutate({ id: editTarget.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  }

  function togglePermission(permissionId: string) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permissionId)) {
        next.delete(permissionId);
      } else {
        next.add(permissionId);
      }
      return next;
    });
  }

  function toggleModulePermissions(modulePermissions: Permission[]) {
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      const allSelected = modulePermissions.every((p) => next.has(p.id));
      if (allSelected) {
        modulePermissions.forEach((p) => next.delete(p.id));
      } else {
        modulePermissions.forEach((p) => next.add(p.id));
      }
      return next;
    });
  }

  // Group permissions by module
  const permissionsByModule: Record<string, Permission[]> = {};
  if (permissions) {
    for (const perm of permissions) {
      if (!permissionsByModule[perm.module]) {
        permissionsByModule[perm.module] = [];
      }
      permissionsByModule[perm.module].push(perm);
    }
  }

  const isMutating = createMutation.isPending || updateMutation.isPending;

  if (!hasPermission("roles.manage")) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("settings.roles.title")} description={t("settings.roles.descriptionShort")} />
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("settings.roles.noPermission")}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t("settings.roles.title")} description={t("settings.roles.description")}>
        <Button onClick={openAddDialog}>
          <Plus className="size-4" />
          {t("settings.roles.addRole")}
        </Button>
      </PageHeader>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.roles.form.nameLabel")}</TableHead>
              <TableHead>{t("settings.roles.form.descriptionLabel")}</TableHead>
              <TableHead>{t("settings.roles.form.permissionsLabel")}</TableHead>
              <TableHead className="w-24 text-right">{t("common.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rolesLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8">
                  {t("settings.roles.loadingRoles")}
                </TableCell>
              </TableRow>
            ) : rolesError ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-destructive"
                >
                  {t("settings.roles.failedToLoadRoles")}
                </TableCell>
              </TableRow>
            ) : !roles?.length ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("settings.roles.noRolesFound")}
                </TableCell>
              </TableRow>
            ) : (
              roles.map((role) => (
                <TableRow key={role.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2">
                      <Shield className="size-4 text-muted-foreground" />
                      {role.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {role.description || "-"}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {t("settings.roles.permissionCount", { count: role._count?.rolePermissions ?? 0 })}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openEditDialog(role)}
                      >
                        <Pencil className="size-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => openDeleteDialog(role)}
                      >
                        <Trash2 className="size-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Add/Edit Role Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {dialogMode === "edit" ? t("settings.roles.editDialog.title") : t("settings.roles.addDialog.title")}
            </DialogTitle>
            <DialogDescription>
              {dialogMode === "edit"
                ? t("settings.roles.editDialog.description")
                : t("settings.roles.addDialog.description")}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="role-name">{t("settings.roles.form.nameLabel")}</Label>
              <Input
                id="role-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder={t("settings.roles.form.namePlaceholder")}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role-description">{t("settings.roles.form.descriptionLabel")}</Label>
              <Input
                id="role-description"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
                placeholder={t("settings.roles.form.descriptionPlaceholder")}
              />
            </div>

            {/* Permissions grouped by module */}
            <div className="space-y-3">
              <Label>{t("settings.roles.form.permissionsLabel")}</Label>
              {Object.keys(permissionsByModule).length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  {t("settings.roles.loadingPermissions")}
                </p>
              ) : (
                <div className="space-y-4 rounded-lg border p-4">
                  {Object.entries(permissionsByModule).map(
                    ([module, modulePerms]) => {
                      const allSelected = modulePerms.every((p) =>
                        selectedPermissionIds.has(p.id)
                      );
                      const someSelected =
                        !allSelected &&
                        modulePerms.some((p) =>
                          selectedPermissionIds.has(p.id)
                        );

                      return (
                        <div key={module} className="space-y-2">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              id={`module-${module}`}
                              checked={allSelected}
                              ref={(el) => {
                                if (el) el.indeterminate = someSelected;
                              }}
                              onChange={() =>
                                toggleModulePermissions(modulePerms)
                              }
                              className="size-4 rounded border-input accent-primary"
                            />
                            <Label
                              htmlFor={`module-${module}`}
                              className="font-medium capitalize cursor-pointer"
                            >
                              {module}
                            </Label>
                          </div>
                          <div className="ml-6 grid gap-1.5">
                            {modulePerms.map((perm) => (
                              <div
                                key={perm.id}
                                className="flex items-center gap-2"
                              >
                                <input
                                  type="checkbox"
                                  id={`perm-${perm.id}`}
                                  checked={selectedPermissionIds.has(perm.id)}
                                  onChange={() => togglePermission(perm.id)}
                                  className="size-4 rounded border-input accent-primary"
                                />
                                <Label
                                  htmlFor={`perm-${perm.id}`}
                                  className="text-sm font-normal cursor-pointer"
                                >
                                  {perm.description || perm.name}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </div>

            <DialogFooter>
              <DialogClose render={<Button variant="outline" />}>
                {t("common.cancel")}
              </DialogClose>
              <Button type="submit" disabled={isMutating}>
                {isMutating
                  ? t("common.saving")
                  : dialogMode === "edit"
                  ? t("common.saveChanges")
                  : t("settings.roles.form.createRole")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.roles.deleteDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("settings.roles.deleteDialog.description", { name: deleteTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              {t("common.cancel")}
            </DialogClose>
            <Button
              variant="destructive"
              onClick={() =>
                deleteTarget && deleteMutation.mutate(deleteTarget.id)
              }
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
