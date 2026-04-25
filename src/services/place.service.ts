import { prisma } from "@/lib/db";

export async function listPlaces(orgId: string) {
  return prisma.place.findMany({
    where: { isActive: true, organizationId: orgId },
    include: {
      _count: { select: { vendors: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getPlace(id: string, orgId: string) {
  const place = await prisma.place.findUnique({
    where: { id },
    include: {
      vendors: {
        where: { isActive: true },
        include: {
          products: {
            include: { product: true },
          },
        },
      },
    },
  });

  if (!place || place.organizationId !== orgId) {
    throw new Error("Place not found");
  }

  return place;
}

export async function createPlace(data: { name: string }, orgId: string) {
  const existing = await prisma.place.findUnique({
    where: { name_organizationId: { name: data.name, organizationId: orgId } },
  });
  if (existing) {
    throw new Error(`A place named "${data.name}" already exists`);
  }

  return prisma.place.create({
    data: { name: data.name, organizationId: orgId },
  });
}

export async function updatePlace(
  id: string,
  data: { name?: string; isActive?: boolean },
  orgId: string
) {
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place || place.organizationId !== orgId) {
    throw new Error("Place not found");
  }

  if (data.name && data.name !== place.name) {
    const existing = await prisma.place.findUnique({
      where: { name_organizationId: { name: data.name, organizationId: orgId } },
    });
    if (existing) {
      throw new Error(`A place named "${data.name}" already exists`);
    }
  }

  return prisma.place.update({ where: { id }, data });
}

export async function deletePlace(id: string, orgId: string) {
  const place = await prisma.place.findUnique({ where: { id } });
  if (!place || place.organizationId !== orgId) {
    throw new Error("Place not found");
  }

  const vendorCount = await prisma.vendor.count({
    where: { placeId: id, isActive: true },
  });
  if (vendorCount > 0) {
    throw new Error(
      `Cannot delete place: ${vendorCount} vendor(s) are assigned to it`
    );
  }

  return prisma.place.update({ where: { id }, data: { isActive: false } });
}
