import { prisma } from "@/lib/db";

export async function listSalespersons(orgId: string) {
  return prisma.salesperson.findMany({
    where: { isActive: true, organizationId: orgId },
    include: {
      _count: { select: { places: true } },
    },
    orderBy: { name: "asc" },
  });
}

export async function getSalesperson(id: string, orgId: string) {
  const salesperson = await prisma.salesperson.findUnique({
    where: { id },
    include: {
      places: {
        include: { place: true },
      },
      _count: { select: { collections: true } },
    },
  });

  if (!salesperson || salesperson.organizationId !== orgId) {
    throw new Error("Salesperson not found");
  }

  return salesperson;
}

export async function createSalesperson(
  data: { name: string; phone?: string },
  orgId: string
) {
  const existing = await prisma.salesperson.findUnique({
    where: { name_organizationId: { name: data.name, organizationId: orgId } },
  });
  if (existing) {
    throw new Error(`A salesperson named "${data.name}" already exists`);
  }

  return prisma.salesperson.create({
    data: {
      name: data.name,
      phone: data.phone ?? "",
      organizationId: orgId,
    },
  });
}

export async function updateSalesperson(
  id: string,
  data: { name?: string; phone?: string; isActive?: boolean },
  orgId: string
) {
  const salesperson = await prisma.salesperson.findUnique({ where: { id } });
  if (!salesperson || salesperson.organizationId !== orgId) {
    throw new Error("Salesperson not found");
  }

  if (data.name && data.name !== salesperson.name) {
    const existing = await prisma.salesperson.findUnique({
      where: { name_organizationId: { name: data.name, organizationId: orgId } },
    });
    if (existing) {
      throw new Error(`A salesperson named "${data.name}" already exists`);
    }
  }

  return prisma.salesperson.update({
    where: { id },
    data,
  });
}

export async function deleteSalesperson(id: string, orgId: string) {
  const salesperson = await prisma.salesperson.findUnique({ where: { id } });
  if (!salesperson || salesperson.organizationId !== orgId) {
    throw new Error("Salesperson not found");
  }

  return prisma.salesperson.update({
    where: { id },
    data: { isActive: false },
  });
}

export async function setSalespersonPlaces(
  id: string,
  placeIds: string[],
  orgId: string
) {
  return prisma.$transaction(async (tx) => {
    const salesperson = await tx.salesperson.findUnique({ where: { id } });
    if (!salesperson || salesperson.organizationId !== orgId) {
      throw new Error("Salesperson not found");
    }

    if (placeIds.length > 0) {
      const validCount = await tx.place.count({
        where: { id: { in: placeIds }, organizationId: orgId, isActive: true },
      });
      if (validCount !== placeIds.length) {
        throw new Error("One or more places are invalid or do not belong to this organisation");
      }
    }

    await tx.salespersonPlace.deleteMany({ where: { salespersonId: id } });

    if (placeIds.length > 0) {
      await tx.salespersonPlace.createMany({
        data: placeIds.map((placeId) => ({ salespersonId: id, placeId })),
      });
    }

    return tx.salesperson.findUnique({
      where: { id },
      include: {
        places: { include: { place: true } },
      },
    });
  });
}

export async function getSalespersonVendorProducts(id: string, orgId: string) {
  const salesperson = await prisma.salesperson.findUnique({
    where: { id },
    include: {
      places: {
        include: {
          place: {
            include: {
              vendors: {
                where: { isActive: true },
                include: {
                  products: {
                    where: { product: { isActive: true } },
                    include: { product: true },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!salesperson || salesperson.organizationId !== orgId) {
    throw new Error("Salesperson not found");
  }

  const result: Array<{
    place: { id: string; name: string };
    vendor: { id: string; name: string };
    products: Array<{
      productId: string;
      rate: number;
      product: { id: string; name: string; unit: string };
    }>;
  }> = [];

  for (const sp of salesperson.places) {
    for (const vendor of sp.place.vendors) {
      if (vendor.products.length === 0) continue;
      result.push({
        place: { id: sp.place.id, name: sp.place.name },
        vendor: { id: vendor.id, name: vendor.name },
        products: vendor.products.map((vp) => ({
          productId: vp.productId,
          rate: vp.rate,
          product: {
            id: vp.product.id,
            name: vp.product.name,
            unit: vp.product.unit,
          },
        })),
      });
    }
  }

  return result;
}

export async function getSalespersonHistory(
  id: string,
  orgId: string,
  params: { startDate: Date; endDate: Date }
) {
  return prisma.collectionItem.findMany({
    where: {
      collection: {
        salespersonId: id,
        organizationId: orgId,
        date: { gte: params.startDate, lte: params.endDate },
      },
    },
    include: {
      collection: { select: { date: true } },
      vendor: { include: { place: true } },
      product: true,
    },
    orderBy: [{ collection: { date: "asc" } }, { vendor: { name: "asc" } }],
  });
}
