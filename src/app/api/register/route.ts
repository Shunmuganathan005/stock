import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { login } from "@/lib/auth";
import { createOrganization } from "@/services/organization.service";

const registerSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const data = registerSchema.parse(body);

    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      return NextResponse.json(
        { success: false, error: "Email already registered" },
        { status: 400 }
      );
    }

    const { user } = await createOrganization({
      businessName: data.businessName,
      ownerName: data.name,
      ownerEmail: data.email,
      ownerPassword: data.password,
    });

    // Auto-login after registration
    await login(data.email, data.password);

    return NextResponse.json(
      { success: true, data: { id: user.id, name: user.name, email: user.email } },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { success: false, error: error.issues[0].message },
        { status: 400 }
      );
    }
    console.error("Register error:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
