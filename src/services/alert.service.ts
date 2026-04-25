import { prisma } from "@/lib/db";
import type { Prisma } from "@prisma/client";

interface ListAlertsParams {
  isRead?: boolean;
  page?: number;
  pageSize?: number;
}

export async function listAlerts(params: ListAlertsParams, orgId: string) {
  const { isRead, page = 1, pageSize = 20 } = params;
  const skip = (page - 1) * pageSize;

  const where: Prisma.AlertWhereInput = {
    organizationId: orgId,
  };

  if (isRead !== undefined) {
    where.isRead = isRead;
  }

  const [items, total] = await Promise.all([
    prisma.alert.findMany({
      where,
      include: {
        product: true,
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    prisma.alert.count({ where }),
  ]);

  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getUnreadCount(orgId: string) {
  return prisma.alert.count({
    where: { isRead: false, organizationId: orgId },
  });
}

export async function markAsRead(id: string, orgId: string) {
  const alert = await prisma.alert.findUnique({ where: { id } });

  if (!alert || alert.organizationId !== orgId) {
    throw new Error("Alert not found");
  }

  return prisma.alert.update({
    where: { id },
    data: { isRead: true },
  });
}

export async function markAllAsRead(orgId: string) {
  return prisma.alert.updateMany({
    where: { isRead: false, organizationId: orgId },
    data: { isRead: true },
  });
}
