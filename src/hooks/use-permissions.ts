"use client";

import { useSession } from "next-auth/react";
import type { PermissionName } from "@/lib/constants/permissions";

export function usePermissions() {
  const { data: session, status } = useSession();

  const permissions: string[] = session?.user?.permissions ?? [];
  const role = session?.user?.role ?? null;

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
    isLoading: status === "loading",
    isAuthenticated: status === "authenticated",
  };
}
