"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { t } from "@/lib/locales";
import { usePermissions } from "@/hooks/use-permissions";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pencil } from "lucide-react";

interface Role {
  id: string;
  name: string;
  description: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  isActive: boolean;
  createdAt: string;
  role: Role;
}

interface UsersResponse {
  items: User[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function UsersPage() {
  const queryClient = useQueryClient();
  const { hasPermission } = usePermissions();

  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<User | null>(null);
  const [editRoleId, setEditRoleId] = useState("");
  const [editIsActive, setEditIsActive] = useState(true);

  const { data, isLoading, isError } = useQuery<UsersResponse>({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: hasPermission("users.manage"),
  });

  const { data: roles } = useQuery<Role[]>({
    queryKey: ["roles"],
    queryFn: async () => {
      const res = await fetch("/api/roles");
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    enabled: hasPermission("users.manage"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { roleId: string; isActive: boolean };
    }) => {
      const res = await fetch(`/api/users/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const json = await res.json();
      if (!json.success) throw new Error(json.error);
      return json.data;
    },
    onSuccess: () => {
      toast.success(t("settings.users.userUpdatedSuccess"));
      queryClient.invalidateQueries({ queryKey: ["users"] });
      setEditDialogOpen(false);
      setEditTarget(null);
    },
    onError: (error: Error) => {
      toast.error(error.message || t("settings.users.failedToUpdateUser"));
    },
  });

  function openEditDialog(user: User) {
    setEditTarget(user);
    setEditRoleId(user.role.id);
    setEditIsActive(user.isActive);
    setEditDialogOpen(true);
  }

  function handleEditSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!editTarget) return;
    updateMutation.mutate({
      id: editTarget.id,
      data: {
        roleId: editRoleId,
        isActive: editIsActive,
      },
    });
  }

  if (!hasPermission("users.manage")) {
    return (
      <div className="space-y-6">
        <PageHeader title={t("settings.users.title")} description={t("settings.users.descriptionShort")} />
        <div className="flex justify-center py-12 text-muted-foreground">
          {t("settings.users.noPermission")}
        </div>
      </div>
    );
  }

  const users = data?.items ?? data ?? [];

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("settings.users.title")}
        description={t("settings.users.description")}
      />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>{t("settings.users.columns.name")}</TableHead>
              <TableHead>{t("settings.users.columns.email")}</TableHead>
              <TableHead>{t("settings.users.columns.role")}</TableHead>
              <TableHead>{t("settings.users.columns.status")}</TableHead>
              <TableHead className="w-16 text-right">{t("settings.users.columns.actions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-8">
                  {t("settings.users.loadingUsers")}
                </TableCell>
              </TableRow>
            ) : isError ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-destructive"
                >
                  {t("settings.users.failedToLoadUsers")}
                </TableCell>
              </TableRow>
            ) : !Array.isArray(users) || users.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={5}
                  className="text-center py-8 text-muted-foreground"
                >
                  {t("settings.users.noUsersFound")}
                </TableCell>
              </TableRow>
            ) : (
              users.map((user: User) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {user.email}
                  </TableCell>
                  <TableCell>{user.role?.name ?? "-"}</TableCell>
                  <TableCell>
                    <Badge
                      variant={user.isActive ? "default" : "secondary"}
                    >
                      {user.isActive ? t("common.active") : t("common.inactive")}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => openEditDialog(user)}
                    >
                      <Pencil className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit User Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t("settings.users.editDialog.title")}</DialogTitle>
            <DialogDescription>
              {t("settings.users.editDialog.description", { name: editTarget?.name ?? "" })}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label>{t("settings.users.editDialog.roleLabel")}</Label>
              <Select
                value={editRoleId}
                onValueChange={(val) => val && setEditRoleId(val)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={t("settings.users.editDialog.rolePlaceholder")} />
                </SelectTrigger>
                <SelectContent>
                  {roles?.map((role) => (
                    <SelectItem key={role.id} value={role.id}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{t("settings.users.editDialog.statusLabel")}</Label>
              <Select
                value={editIsActive ? "active" : "inactive"}
                onValueChange={(val) => val && setEditIsActive(val === "active")}
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{t("common.active")}</SelectItem>
                  <SelectItem value="inactive">{t("common.inactive")}</SelectItem>
                </SelectContent>
              </Select>
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
    </div>
  );
}
