import { prisma } from "@/lib/db";

export async function listTaxRates(orgId: string) {
  return prisma.taxRate.findMany({
    where: { isActive: true, organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function createTaxRate(
  data: { name: string; percentage: number },
  orgId: string
) {
  const existing = await prisma.taxRate.findUnique({
    where: { name_organizationId: { name: data.name, organizationId: orgId } },
  });

  if (existing) {
    throw new Error("A tax rate with this name already exists");
  }

  return prisma.taxRate.create({
    data: {
      name: data.name,
      percentage: data.percentage,
      organizationId: orgId,
    },
  });
}

export async function updateTaxRate(
  id: string,
  data: { name?: string; percentage?: number; isActive?: boolean },
  orgId: string
) {
  const taxRate = await prisma.taxRate.findUnique({ where: { id } });

  if (!taxRate || taxRate.organizationId !== orgId) {
    throw new Error("Tax rate not found");
  }

  return prisma.taxRate.update({
    where: { id },
    data,
  });
}
