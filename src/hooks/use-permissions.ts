"use client";

import { useSession } from "@/hooks/use-session";
import type { PermissionName } from "@/lib/constants/permissions";

export function usePermissions() {
  const { user, isLoading, isAuthenticated } = useSession();

  const permissions: string[] = user?.permissions ?? [];
  const role = user ? { id: user.roleId, name: user.roleName } : null;

  function hasPermission(permission: PermissionName): boolean {
    return permissions.includes(permission);
  }

  function hasAnyPermission(...perms: PermissionName[]): boolean {
    return perms.some((p) => permissions.includes(p));
  }

  function hasAllPermissions(...perms: PermissionName[]): boolean {
    return perms.every((p) => permissions.includes(p));
  }

  return {
    permissions,
    role,
    hasPermission,
    hasAnyPermission,
    hasAllPermissions,
    isLoading,
    isAuthenticated,
  };
}
