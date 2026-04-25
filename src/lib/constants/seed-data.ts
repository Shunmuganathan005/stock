export const SEED_PERMISSIONS = [
  { name: "dashboard.view", description: "View dashboard", module: "dashboard" },
  { name: "products.view", description: "View products", module: "products" },
  { name: "products.create", description: "Create products", module: "products" },
  { name: "products.edit", description: "Edit products", module: "products" },
  { name: "products.delete", description: "Delete products", module: "products" },
  { name: "customers.view", description: "View customers", module: "customers" },
  { name: "customers.create", description: "Create customers", module: "customers" },
  { name: "customers.edit", description: "Edit customers", module: "customers" },
  { name: "customers.delete", description: "Delete customers", module: "customers" },
  { name: "sales.view", description: "View sales", module: "sales" },
  { name: "sales.create", description: "Create sales", module: "sales" },
  { name: "payments.record", description: "Record payments", module: "payments" },
  { name: "users.manage", description: "Manage users", module: "users" },
  { name: "roles.manage", description: "Manage roles", module: "roles" },
  { name: "settings.manage", description: "Manage settings", module: "settings" },
];

export const SEED_ROLES = {
  Admin: {
    description: "Full access to all features",
    permissions: SEED_PERMISSIONS.map((p) => p.name),
  },
  Staff: {
    description: "Can create and edit, but not delete or manage users",
    permissions: [
      "dashboard.view",
      "products.view",
      "products.create",
      "products.edit",
      "customers.view",
      "customers.create",
      "customers.edit",
      "sales.view",
      "sales.create",
      "payments.record",
    ],
  },
  Viewer: {
    description: "Read-only access",
    permissions: [
      "dashboard.view",
      "products.view",
      "customers.view",
      "sales.view",
    ],
  },
};

export const SEED_TAX_RATES = [
  { name: "No Tax", percentage: 0 },
  { name: "GST 5%", percentage: 5 },
  { name: "GST 12%", percentage: 12 },
  { name: "GST 18%", percentage: 18 },
  { name: "GST 28%", percentage: 28 },
];

export const SEED_CATEGORIES = [
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Office Supplies",
  "General",
];
