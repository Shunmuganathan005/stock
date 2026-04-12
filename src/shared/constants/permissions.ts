export const PERMISSIONS = {
  DASHBOARD_VIEW: "dashboard.view",
  PRODUCTS_VIEW: "products.view",
  PRODUCTS_CREATE: "products.create",
  PRODUCTS_EDIT: "products.edit",
  PRODUCTS_DELETE: "products.delete",
  CUSTOMERS_VIEW: "customers.view",
  CUSTOMERS_CREATE: "customers.create",
  CUSTOMERS_EDIT: "customers.edit",
  CUSTOMERS_DELETE: "customers.delete",
  SALES_VIEW: "sales.view",
  SALES_CREATE: "sales.create",
  PAYMENTS_RECORD: "payments.record",
  USERS_MANAGE: "users.manage",
  ROLES_MANAGE: "roles.manage",
  SETTINGS_MANAGE: "settings.manage",
} as const;

export type PermissionName = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

export const ALL_PERMISSIONS = Object.values(PERMISSIONS);
