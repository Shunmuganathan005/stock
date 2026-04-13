import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface ListCustomersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(params: ListCustomersParams) {
  const { search, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = {
    isActive: true,
  };

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { businessName: { contains: search, mode: "insensitive" } },
      { phone: { contains: search, mode: "insensitive" } },
    ];
  }

  const [items, total] = await Promise.all([
    prisma.customer.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.customer.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getCustomer(id: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: {
        select: { sales: true },
      },
    },
  });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function createCustomer(data: Prisma.CustomerCreateInput) {
  return prisma.customer.create({ data });
}

export async function updateCustomer(
  id: string,
  data: Prisma.CustomerUpdateInput
) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(id: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer) {
    throw new Error("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}
