import { NextResponse } from "next/server";
import { z } from "zod";
import { withPermission } from "@/lib/auth";
import { PERMISSIONS } from "@/lib/constants/permissions";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

const inviteSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  roleId: z.string().min(1, "Role is required"),
});

export const POST = withPermission(PERMISSIONS.USERS_MANAGE, async (request, user) => {
  const body = await request.json();
  const data = inviteSchema.parse(body);

  // Check email not taken
  const existing = await prisma.user.findUnique({
    where: { email: data.email },
  });
  if (existing) {
    return NextResponse.json(
      { success: false, error: "Email already registered" },
      { status: 400 }
    );
  }

  // Verify role belongs to caller's org
  const role = await prisma.role.findUnique({
    where: { id: data.roleId },
  });
  if (!role || role.organizationId !== user.organizationId) {
    return NextResponse.json(
      { success: false, error: "Role not found" },
      { status: 400 }
    );
  }

  const hashedPassword = await bcrypt.hash(data.password, 12);

  const newUser = await prisma.user.create({
    data: {
      name: data.name,
      email: data.email,
      hashedPassword,
      roleId: data.roleId,
      organizationId: user.organizationId,
      isOwner: false,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  });

  return NextResponse.json({ success: true, data: newUser }, { status: 201 });
});
