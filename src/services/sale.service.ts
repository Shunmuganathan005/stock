import { prisma } from "@/lib/db";
import type { Prisma, PaymentStatus } from "@prisma/client";

interface ListSalesParams {
  search?: string;
  paymentStatus?: PaymentStatus;
  customerId?: string;
  page?: number;
  pageSize?: number;
}

interface CreateSaleItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  taxRate: number;
}

interface CreateSaleData {
  customerId: string;
  notes?: string;
  items: CreateSaleItem[];
}

export async function listSales(params: ListSalesParams) {
  const { search, paymentStatus, customerId, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.SaleWhereInput = {};

  if (search) {
    where.OR = [
      { saleNumber: { contains: search, mode: "insensitive" } },
      { customer: { name: { contains: search, mode: "insensitive" } } },
      { customer: { businessName: { contains: search, mode: "insensitive" } } },
    ];
  }

  if (paymentStatus) {
    where.paymentStatus = paymentStatus;
  }

  if (customerId) {
    where.customerId = customerId;
  }

  const [items, total] = await Promise.all([
    prisma.sale.findMany({
      where,
      include: {
        customer: true,
        _count: {
          select: { items: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.sale.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getSale(id: string) {
  const sale = await prisma.sale.findUnique({
    where: { id },
    include: {
      customer: true,
      items: {
        include: {
          product: true,
        },
      },
      payments: {
        orderBy: { createdAt: "desc" },
      },
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return sale;
}

export async function getNextSaleNumber(): Promise<string> {
  const lastSale = await prisma.sale.findFirst({
    orderBy: { saleNumber: "desc" },
    select: { saleNumber: true },
  });

  if (!lastSale) {
    return "SALE-0001";
  }

  const lastNumber = parseInt(lastSale.saleNumber.replace("SALE-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `SALE-${nextNumber.toString().padStart(4, "0")}`;
}

export async function createSale(data: CreateSaleData, userId: string) {
  const { customerId, notes, items } = data;

  if (!items || items.length === 0) {
    throw new Error("At least one item is required");
  }

  // Verify customer exists
  const customer = await prisma.customer.findUnique({
    where: { id: customerId },
  });
  if (!customer) {
    throw new Error("Customer not found");
  }

  return prisma.$transaction(async (tx) => {
    // Generate sale number
    const saleNumber = await getNextSaleNumberInTx(tx);

    // Process each item: validate stock and calculate totals
    let subtotal = 0;
    let taxTotal = 0;

    const saleItemsData: Prisma.SaleItemCreateManySaleInput[] = [];
    const stockUpdates: { productId: string; quantity: number; name: string }[] = [];
    const alertsToCreate: Prisma.AlertCreateManyInput[] = [];

    for (const item of items) {
      const product = await tx.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (!product.isActive) {
        throw new Error(`Product "${product.name}" is no longer active`);
      }

      if (product.stockQuantity < item.quantity) {
        throw new Error(
          `Insufficient stock for "${product.name}": available ${product.stockQuantity}, requested ${item.quantity}`
        );
      }

      const itemSubtotal = item.unitPrice * item.quantity;
      const taxAmount = (itemSubtotal * item.taxRate) / 100;
      const totalPrice = itemSubtotal + taxAmount;

      subtotal += itemSubtotal;
      taxTotal += taxAmount;

      saleItemsData.push({
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: Math.round(taxAmount * 100) / 100,
        totalPrice: Math.round(totalPrice * 100) / 100,
      });

      stockUpdates.push({
        productId: item.productId,
        quantity: item.quantity,
        name: product.name,
      });

      // Check if stock will fall below min level
      const newStock = product.stockQuantity - item.quantity;
      if (newStock <= 0) {
        alertsToCreate.push({
          productId: item.productId,
          type: "OUT_OF_STOCK",
          message: `"${product.name}" is out of stock (0 remaining)`,
        });
      } else if (newStock < product.minStockLevel) {
        alertsToCreate.push({
          productId: item.productId,
          type: "LOW_STOCK",
          message: `"${product.name}" is below minimum stock level (${newStock} remaining, minimum is ${product.minStockLevel})`,
        });
      }
    }

    const grandTotal = Math.round((subtotal + taxTotal) * 100) / 100;
    subtotal = Math.round(subtotal * 100) / 100;
    taxTotal = Math.round(taxTotal * 100) / 100;

    // Create sale with items
    const sale = await tx.sale.create({
      data: {
        saleNumber,
        customerId,
        subtotal,
        taxTotal,
        grandTotal,
        notes: notes ?? "",
        createdById: userId,
        items: {
          createMany: {
            data: saleItemsData,
          },
        },
      },
      include: {
        customer: true,
        items: {
          include: { product: true },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    // Deduct stock for each product
    for (const update of stockUpdates) {
      await tx.product.update({
        where: { id: update.productId },
        data: {
          stockQuantity: { decrement: update.quantity },
        },
      });
    }

    // Create alerts for low/out-of-stock items
    if (alertsToCreate.length > 0) {
      await tx.alert.createMany({
        data: alertsToCreate,
      });
    }

    return sale;
  });
}

/**
 * Generate next sale number inside a Prisma transaction to avoid race conditions.
 */
async function getNextSaleNumberInTx(
  tx: Prisma.TransactionClient
): Promise<string> {
  const lastSale = await tx.sale.findFirst({
    orderBy: { saleNumber: "desc" },
    select: { saleNumber: true },
  });

  if (!lastSale) {
    return "SALE-0001";
  }

  const lastNumber = parseInt(lastSale.saleNumber.replace("SALE-", ""), 10);
  const nextNumber = lastNumber + 1;
  return `SALE-${nextNumber.toString().padStart(4, "0")}`;
}
