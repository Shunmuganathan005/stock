import { prisma } from "@/lib/db";
import type { PaymentMethod } from "@prisma/client";

interface RecordPaymentData {
  saleId: string;
  amount: number;
  method?: PaymentMethod;
  referenceNumber?: string;
  notes?: string;
}

export async function recordPayment(data: RecordPaymentData, userId: string) {
  const { saleId, amount, method, referenceNumber, notes } = data;

  if (amount <= 0) {
    throw new Error("Payment amount must be greater than zero");
  }

  // Get sale with existing payments
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
    include: {
      payments: true,
    },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  const totalPaid = sale.payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = Math.round((sale.grandTotal - totalPaid) * 100) / 100;

  if (amount > remaining + 0.01) {
    throw new Error(
      `Payment amount (${amount}) exceeds remaining balance (${remaining})`
    );
  }

  const newTotalPaid = Math.round((totalPaid + amount) * 100) / 100;
  const newStatus =
    newTotalPaid >= sale.grandTotal ? "PAID" : "PARTIAL";

  // Create payment and update sale status in a transaction
  const [payment] = await prisma.$transaction([
    prisma.payment.create({
      data: {
        saleId,
        amount,
        method: method ?? "CASH",
        referenceNumber: referenceNumber ?? "",
        notes: notes ?? "",
        recordedById: userId,
      },
    }),
    prisma.sale.update({
      where: { id: saleId },
      data: { paymentStatus: newStatus },
    }),
  ]);

  return payment;
}

export async function getSalePayments(saleId: string) {
  const sale = await prisma.sale.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    throw new Error("Sale not found");
  }

  return prisma.payment.findMany({
    where: { saleId },
    include: {
      recordedBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });
}
