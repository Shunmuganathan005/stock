import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

// ─── Users ────────────────────────────────────────────────

export async function listUsers() {
  return prisma.user.findMany({
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function getUser(id: string) {
  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
      roleId: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  return user;
}

export async function updateUser(
  id: string,
  data: { name?: string; email?: string; roleId?: string; isActive?: boolean }
) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error("User not found");
  }

  if (data.email && data.email !== user.email) {
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existing) {
      throw new Error("A user with this email already exists");
    }
  }

  if (data.roleId) {
    const role = await prisma.role.findUnique({ where: { id: data.roleId } });
    if (!role) {
      throw new Error("Role not found");
    }
  }

  return prisma.user.update({
    where: { id },
    data,
    select: {
      id: true,
      name: true,
      email: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      role: true,
    },
  });
}

export async function updatePassword(
  id: string,
  data: { currentPassword: string; newPassword: string }
) {
  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new Error("User not found");
  }

  const isValid = await bcrypt.compare(data.currentPassword, user.hashedPassword);
  if (!isValid) {
    throw new Error("Current password is incorrect");
  }

  if (data.newPassword.length < 6) {
    throw new Error("New password must be at least 6 characters");
  }

  const hashedPassword = await bcrypt.hash(data.newPassword, 12);

  await prisma.user.update({
    where: { id },
    data: { hashedPassword },
  });

  return { message: "Password updated successfully" };
}

// ─── Roles ────────────────────────────────────────────────

export async function listRoles() {
  return prisma.role.findMany({
    include: {
      _count: {
        select: { rolePermissions: true },
      },
    },
    orderBy: { name: "asc" },
  });
}

export async function getRole(id: string) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });

  if (!role) {
    throw new Error("Role not found");
  }

  return role;
}

export async function createRole(data: {
  name: string;
  description?: string;
  permissionIds: string[];
}) {
  const existing = await prisma.role.findUnique({
    where: { name: data.name },
  });

  if (existing) {
    throw new Error("A role with this name already exists");
  }

  // Validate that all permission IDs exist
  if (data.permissionIds.length > 0) {
    const permCount = await prisma.permission.count({
      where: { id: { in: data.permissionIds } },
    });
    if (permCount !== data.permissionIds.length) {
      throw new Error("One or more permission IDs are invalid");
    }
  }

  return prisma.role.create({
    data: {
      name: data.name,
      description: data.description ?? "",
      rolePermissions: {
        createMany: {
          data: data.permissionIds.map((permissionId) => ({ permissionId })),
        },
      },
    },
    include: {
      rolePermissions: {
        include: {
          permission: true,
        },
      },
    },
  });
}

export async function updateRole(
  id: string,
  data: { name?: string; description?: string; permissionIds?: string[] }
) {
  const role = await prisma.role.findUnique({ where: { id } });

  if (!role) {
    throw new Error("Role not found");
  }

  if (data.name && data.name !== role.name) {
    const existing = await prisma.role.findUnique({
      where: { name: data.name },
    });
    if (existing) {
      throw new Error("A role with this name already exists");
    }
  }

  // Validate permission IDs if provided
  if (data.permissionIds && data.permissionIds.length > 0) {
    const permCount = await prisma.permission.count({
      where: { id: { in: data.permissionIds } },
    });
    if (permCount !== data.permissionIds.length) {
      throw new Error("One or more permission IDs are invalid");
    }
  }

  return prisma.$transaction(async (tx) => {
    // Update role basic fields
    await tx.role.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.description !== undefined && { description: data.description }),
      },
    });

    // If permissionIds provided, replace all role permissions
    if (data.permissionIds !== undefined) {
      await tx.rolePermission.deleteMany({ where: { roleId: id } });

      if (data.permissionIds.length > 0) {
        await tx.rolePermission.createMany({
          data: data.permissionIds.map((permissionId) => ({
            roleId: id,
            permissionId,
          })),
        });
      }
    }

    return tx.role.findUnique({
      where: { id },
      include: {
        rolePermissions: {
          include: {
            permission: true,
          },
        },
      },
    });
  });
}

export async function deleteRole(id: string) {
  const role = await prisma.role.findUnique({ where: { id } });

  if (!role) {
    throw new Error("Role not found");
  }

  const userCount = await prisma.user.count({
    where: { roleId: id },
  });

  if (userCount > 0) {
    throw new Error(
      `Cannot delete role: ${userCount} user(s) are currently assigned to it`
    );
  }

  return prisma.role.delete({ where: { id } });
}

// ─── Permissions ──────────────────────────────────────────

export async function listPermissions() {
  return prisma.permission.findMany({
    orderBy: [{ module: "asc" }, { name: "asc" }],
  });
}
