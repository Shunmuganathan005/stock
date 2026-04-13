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
    ],
  },
  Viewer: {
    description: "Read-only access",
    permissions: [
      "dashboard.view", "products.view", "customers.view", "sales.view",
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

async function main() {
  console.log("Seeding database...");

  // Create permissions
  for (const perm of PERMISSIONS) {
    await prisma.permission.upsert({
      where: { name: perm.name },
      update: {},
      create: perm,
    });
  }
  console.log("Permissions created");

  // Create roles with permissions
  for (const [roleName, roleData] of Object.entries(ROLES)) {
    const role = await prisma.role.upsert({
      where: { name: roleName },
      update: { description: roleData.description },
      create: { name: roleName, description: roleData.description },
    });

    // Clear existing role permissions and re-create
    await prisma.rolePermission.deleteMany({ where: { roleId: role.id } });

    for (const permName of roleData.permissions) {
      const permission = await prisma.permission.findUnique({
        where: { name: permName },
      });
      if (permission) {
        await prisma.rolePermission.create({
          data: { roleId: role.id, permissionId: permission.id },
        });
      }
    }
  }
  console.log("Roles created");

  // Create default admin user
  const adminRole = await prisma.role.findUnique({ where: { name: "Admin" } });
  if (adminRole) {
    const hashedPassword = await bcrypt.hash("admin123", 12);
    await prisma.user.upsert({
      where: { email: "admin@stock.com" },
      update: {},
      create: {
        name: "Admin",
        email: "admin@stock.com",
        hashedPassword,
        roleId: adminRole.id,
      },
    });
    console.log("Admin user created (admin@stock.com / admin123)");
  }

  // Create tax rates
  for (const tax of TAX_RATES) {
    await prisma.taxRate.upsert({
      where: { name: tax.name },
      update: {},
      create: tax,
    });
  }
  console.log("Tax rates created");

  // Create sample categories
  const categories = ["Electronics", "Clothing", "Food & Beverages", "Office Supplies", "General"];
  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
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
