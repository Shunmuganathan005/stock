import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface ListCustomersParams {
  search?: string;
  page?: number;
  pageSize?: number;
}

export async function listCustomers(params: ListCustomersParams, orgId: string) {
  const { search, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.CustomerWhereInput = {
    isActive: true,
    organizationId: orgId,
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

export async function getCustomer(id: string, orgId: string) {
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      _count: {
        select: { sales: true },
      },
    },
  });

  if (!customer || customer.organizationId !== orgId) {
    throw new Error("Customer not found");
  }

  return customer;
}

export async function createCustomer(
  data: {
    name: string;
    businessName?: string;
    gstin?: string;
    phone?: string;
    email?: string;
    address?: string;
  },
  orgId: string
) {
  return prisma.customer.create({
    data: {
      ...data,
      organizationId: orgId,
    },
  });
}

export async function updateCustomer(
  id: string,
  data: Prisma.CustomerUpdateInput,
  orgId: string
) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer || customer.organizationId !== orgId) {
    throw new Error("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data,
  });
}

export async function deleteCustomer(id: string, orgId: string) {
  const customer = await prisma.customer.findUnique({ where: { id } });

  if (!customer || customer.organizationId !== orgId) {
    throw new Error("Customer not found");
  }

  return prisma.customer.update({
    where: { id },
    data: { isActive: false },
  });
}
