import { PERMISSIONS } from "./permissions";

export const DEFAULT_ROLES = {
  ADMIN: {
    name: "Admin",
    description: "Full access to all features",
    permissions: Object.values(PERMISSIONS),
  },
  STAFF: {
    name: "Staff",
    description: "Can create and edit, but not delete or manage users",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.PRODUCTS_CREATE,
      PERMISSIONS.PRODUCTS_EDIT,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.CUSTOMERS_CREATE,
      PERMISSIONS.CUSTOMERS_EDIT,
      PERMISSIONS.SALES_VIEW,
      PERMISSIONS.SALES_CREATE,
      PERMISSIONS.PAYMENTS_RECORD,
    ],
  },
  VIEWER: {
    name: "Viewer",
    description: "Read-only access",
    permissions: [
      PERMISSIONS.DASHBOARD_VIEW,
      PERMISSIONS.PRODUCTS_VIEW,
      PERMISSIONS.CUSTOMERS_VIEW,
      PERMISSIONS.SALES_VIEW,
    ],
  },
} as const;
