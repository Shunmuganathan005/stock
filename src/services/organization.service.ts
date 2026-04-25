import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";
import {
  SEED_ROLES,
  SEED_TAX_RATES,
  SEED_CATEGORIES,
} from "@/lib/constants/seed-data";

interface CreateOrganizationInput {
  businessName: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}

export async function createOrganization(input: CreateOrganizationInput) {
  const { businessName, ownerName, ownerEmail, ownerPassword } = input;

  const hashedPassword = await bcrypt.hash(ownerPassword, 12);

  return prisma.$transaction(async (tx) => {
    // 1. Create organization
    const org = await tx.organization.create({
      data: { name: businessName },
    });

    // 2. Create roles scoped to this org
    const roleMap: Record<string, string> = {};

    for (const [roleName, roleData] of Object.entries(SEED_ROLES)) {
      const role = await tx.role.create({
        data: {
          name: roleName,
          description: roleData.description,
          organizationId: org.id,
        },
      });
      roleMap[roleName] = role.id;

      // Assign permissions to role
      if (roleData.permissions.length > 0) {
        const permissions = await tx.permission.findMany({
          where: { name: { in: roleData.permissions } },
          select: { id: true },
        });

        await tx.rolePermission.createMany({
          data: permissions.map((p) => ({
            roleId: role.id,
            permissionId: p.id,
          })),
        });
      }
    }

    // 3. Create owner user with Admin role
    const user = await tx.user.create({
      data: {
        name: ownerName,
        email: ownerEmail,
        hashedPassword,
        roleId: roleMap.Admin,
        organizationId: org.id,
        isOwner: true,
      },
    });

    // 4. Create default categories
    for (const name of SEED_CATEGORIES) {
      await tx.category.create({
        data: { name, organizationId: org.id },
      });
    }

    // 5. Create default tax rates
    for (const taxRate of SEED_TAX_RATES) {
      await tx.taxRate.create({
        data: { ...taxRate, organizationId: org.id },
      });
    }

    return { organization: org, user };
  });
}
