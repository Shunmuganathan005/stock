import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { prisma } from "@/lib/db";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/login");
  }

  // Fetch user permissions from the database
  const user = await prisma.user.findUnique({
    where: { id: (session.user as { id: string }).id },
    include: {
      role: {
        include: {
          rolePermissions: {
            include: { permission: true },
          },
        },
      },
    },
  });

  const permissions = user
    ? user.role.rolePermissions.map((rp: { permission: { name: string } }) => rp.permission.name)
    : [];

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={permissions} />
      <main className="flex-1 pl-64">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
