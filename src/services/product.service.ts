import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface ListProductsParams {
  search?: string;
  categoryId?: string;
  page?: number;
  pageSize?: number;
}

export async function listProducts(params: ListProductsParams) {
  const { search, categoryId, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.ProductWhereInput = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { sku: { contains: search, mode: "insensitive" } },
      { barcode: { contains: search, mode: "insensitive" } },
    ];
  }

  if (categoryId) {
    where.categoryId = categoryId;
  }

  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      include: {
        category: true,
        taxRate: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.product.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getProduct(id: string) {
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      category: true,
      taxRate: true,
    },
  });

  if (!product) {
    throw new Error("Product not found");
  }

  return product;
}

export async function createProduct(data: Prisma.ProductCreateInput) {
  const existing = await prisma.product.findUnique({
    where: { sku: data.sku },
  });

  if (existing) {
    throw new Error("A product with this SKU already exists");
  }

  return prisma.product.create({
    data,
    include: {
      category: true,
      taxRate: true,
    },
  });
}

export async function updateProduct(
  id: string,
  data: Prisma.ProductUpdateInput
) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Product not found");
  }

  if (data.sku && data.sku !== product.sku) {
    const existing = await prisma.product.findUnique({
      where: { sku: data.sku as string },
    });
    if (existing) {
      throw new Error("A product with this SKU already exists");
    }
  }

  return prisma.product.update({
    where: { id },
    data,
    include: {
      category: true,
      taxRate: true,
    },
  });
}

export async function deleteProduct(id: string) {
  const product = await prisma.product.findUnique({ where: { id } });

  if (!product) {
    throw new Error("Product not found");
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}
