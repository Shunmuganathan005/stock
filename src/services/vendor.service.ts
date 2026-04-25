import { prisma } from "@/lib/db";

export async function listVendors(
  params: { placeId?: string },
  orgId: string
) {
  return prisma.vendor.findMany({
    where: {
      isActive: true,
      organizationId: orgId,
      ...(params.placeId ? { placeId: params.placeId } : {}),
    },
    include: {
      place: true,
      _count: { select: { products: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getVendor(id: string, orgId: string) {
  const vendor = await prisma.vendor.findUnique({
    where: { id },
    include: {
      place: true,
      products: {
        include: { product: true },
      },
    },
  });

  if (!vendor || vendor.organizationId !== orgId) {
    throw new Error("Vendor not found");
  }

  return vendor;
}

export async function createVendor(
  data: { name: string; placeId: string },
  orgId: string
) {
  const place = await prisma.place.findUnique({ where: { id: data.placeId } });
  if (!place || place.organizationId !== orgId) {
    throw new Error("Place not found");
  }

  const existing = await prisma.vendor.findUnique({
    where: { name_placeId: { name: data.name, placeId: data.placeId } },
  });
  if (existing) {
    throw new Error(
      `A vendor named "${data.name}" already exists at this place`
    );
  }

  return prisma.vendor.create({
    data: { name: data.name, placeId: data.placeId, organizationId: orgId },
  });
}

export async function updateVendor(
  id: string,
  data: { name?: string; placeId?: string; isActive?: boolean },
  orgId: string
) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.organizationId !== orgId) {
    throw new Error("Vendor not found");
  }

  // If placeId is changing, verify the new place belongs to org
  if (data.placeId && data.placeId !== vendor.placeId) {
    const place = await prisma.place.findUnique({ where: { id: data.placeId } });
    if (!place || place.organizationId !== orgId) {
      throw new Error("Place not found");
    }
  }

  // Check uniqueness for any change that affects the (name, placeId) unique constraint
  const effectiveName = data.name !== undefined ? data.name : vendor.name;
  const effectivePlaceId = data.placeId !== undefined ? data.placeId : vendor.placeId;

  if (effectiveName !== vendor.name || effectivePlaceId !== vendor.placeId) {
    const existing = await prisma.vendor.findUnique({
      where: { name_placeId: { name: effectiveName, placeId: effectivePlaceId } },
    });
    if (existing && existing.id !== id) {
      throw new Error("A vendor with this name already exists at this place");
    }
  }

  return prisma.vendor.update({ where: { id }, data });
}

export async function deleteVendor(id: string, orgId: string) {
  const vendor = await prisma.vendor.findUnique({ where: { id } });
  if (!vendor || vendor.organizationId !== orgId) {
    throw new Error("Vendor not found");
  }

  return prisma.vendor.update({ where: { id }, data: { isActive: false } });
}

export async function setVendorProducts(
  vendorId: string,
  items: { productId: string; rate: number }[],
  orgId: string
) {
  return prisma.$transaction(async (tx) => {
    const vendor = await tx.vendor.findUnique({ where: { id: vendorId } });
    if (!vendor || vendor.organizationId !== orgId) {
      throw new Error("Vendor not found");
    }

    if (items.length > 0) {
      const productIds = items.map((i) => i.productId);
      const validCount = await tx.product.count({
        where: { id: { in: productIds }, organizationId: orgId, isActive: true },
      });
      if (validCount !== productIds.length) {
        throw new Error(
          "One or more products are invalid or do not belong to this organisation"
        );
      }
    }

    await tx.vendorProduct.deleteMany({ where: { vendorId } });

    if (items.length > 0) {
      await tx.vendorProduct.createMany({
        data: items.map((item) => ({
          vendorId,
          productId: item.productId,
          rate: item.rate,
        })),
      });
    }

    return tx.vendor.findUnique({
      where: { id: vendorId },
      include: { products: { include: { product: true } } },
    });
  });
}
