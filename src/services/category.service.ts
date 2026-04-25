import { prisma } from "@/lib/db";

export async function listCategories(orgId: string) {
  return prisma.category.findMany({
    where: { isActive: true, organizationId: orgId },
    orderBy: { name: "asc" },
  });
}

export async function createCategory(
  data: { name: string; description?: string },
  orgId: string
) {
  const existing = await prisma.category.findUnique({
    where: { name_organizationId: { name: data.name, organizationId: orgId } },
  });

  if (existing) {
    throw new Error("A category with this name already exists");
  }

  return prisma.category.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      organizationId: orgId,
    },
  });
}

export async function updateCategory(
  id: string,
  data: { name?: string; description?: string },
  orgId: string
) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category || category.organizationId !== orgId) {
    throw new Error("Category not found");
  }

  if (data.name && data.name !== category.name) {
    const existing = await prisma.category.findUnique({
      where: { name_organizationId: { name: data.name, organizationId: orgId } },
    });
    if (existing) {
      throw new Error("A category with this name already exists");
    }
  }

  return prisma.category.update({
    where: { id },
    data,
  });
}

export async function deleteCategory(id: string, orgId: string) {
  const category = await prisma.category.findUnique({ where: { id } });

  if (!category || category.organizationId !== orgId) {
    throw new Error("Category not found");
  }

  const productCount = await prisma.product.count({
    where: { categoryId: id, isActive: true },
  });

  if (productCount > 0) {
    throw new Error(
      `Cannot delete category: ${productCount} active product(s) are assigned to it`
    );
  }

  return prisma.category.update({
    where: { id },
    data: { isActive: false },
  });
}
