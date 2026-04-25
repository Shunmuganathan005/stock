import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const PERMISSIONS = [
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
  { name: "collections.view",   description: "View collection entries and summary", module: "collections" },
  { name: "collections.create", description: "Create and edit collection entries",  module: "collections" },
  { name: "collections.manage", description: "Manage salespersons, places, vendors", module: "collections" },
];

const ROLES = {
  Admin: {
    description: "Full access to all features",
    permissions: PERMISSIONS.map((p) => p.name),
  },
  Staff: {
    description: "Can create and edit, but not delete or manage users",
    permissions: [
      "dashboard.view", "products.view", "products.create", "products.edit",
      "customers.view", "customers.create", "customers.edit",
      "sales.view", "sales.create", "payments.record",
      "collections.view", "collections.create",
    ],
  },
  Viewer: {
    description: "Read-only access",
    permissions: [
      "dashboard.view", "products.view", "customers.view", "sales.view",
      "collections.view",
    ],
  },
};

const TAX_RATES = [
  { name: "No Tax", percentage: 0 },
  { name: "GST 5%", percentage: 5 },
  { name: "GST 12%", percentage: 12 },
  { name: "GST 18%", percentage: 18 },
  { name: "GST 28%", percentage: 28 },
];

const CATEGORIES = ["Electronics", "Clothing", "Food & Beverages", "Office Supplies", "General"];

async function main() {
  console.log("Seeding database...");

  // 1. Create global permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log("Permissions created");

  // 2. Create default organization
  const org = await prisma.organization.create({
    data: { name: "Default Organization" },
  });
  console.log("Organization created");

  // 3. Create roles scoped to org
  const roleMap: Record<string, string> = {};
  for (const [roleName, roleData] of Object.entries(ROLES)) {
    const role = await prisma.role.create({
      data: {
        name: roleName,
        description: roleData.description,
        organizationId: org.id,
      },
    });
    roleMap[roleName] = role.id;

    // Assign permissions
    const permissions = await prisma.permission.findMany({
      where: { name: { in: roleData.permissions } },
      select: { id: true },
    });
    await prisma.rolePermission.createMany({
      data: permissions.map((p) => ({
        roleId: role.id,
        permissionId: p.id,
      })),
    });
  }
  console.log("Roles created");

  // 4. Create admin user in org
  const hashedPassword = await bcrypt.hash("admin123", 12);
  await prisma.user.create({
    data: {
      name: "Admin",
      email: "admin@stock.com",
      hashedPassword,
      roleId: roleMap.Admin,
      organizationId: org.id,
      isOwner: true,
    },
  });
  console.log("Admin user created (admin@stock.com / admin123)");

  // 5. Create tax rates scoped to org
  for (const tax of TAX_RATES) {
    await prisma.taxRate.create({
      data: { ...tax, organizationId: org.id },
    });
  }
  console.log("Tax rates created");

  // 6. Create categories scoped to org
  for (const name of CATEGORIES) {
    await prisma.category.create({
      data: { name, organizationId: org.id },
    });
  }
  console.log("Categories created");

  console.log("Seed completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
