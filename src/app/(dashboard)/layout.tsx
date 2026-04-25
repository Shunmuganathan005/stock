import { redirect } from "next/navigation";
import { getSessionUser, getUserPermissions } from "@/lib/auth";
import { Sidebar } from "@/components/layout/sidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getSessionUser();

  if (!user) {
    redirect("/login");
  }

  const permissions = await getUserPermissions(user.id);

  return (
    <div className="flex min-h-screen">
      <Sidebar permissions={permissions} />
      <main className="flex-1 pl-64">
        <div className="h-full">{children}</div>
      </main>
    </div>
  );
}
