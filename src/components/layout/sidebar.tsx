"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  Tags,
  Users,
  ShoppingCart,
  Bell,
  Settings,
  Shield,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/locales";

interface NavItem {
  label: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  permission?: string;
}

const mainNavItems: NavItem[] = [
  { label: t("nav.dashboard"), href: "/dashboard", icon: LayoutDashboard },
  { label: t("nav.products"), href: "/products", icon: Package },
  { label: t("nav.categories"), href: "/categories", icon: Tags },
  { label: t("nav.customers"), href: "/customers", icon: Users },
  { label: t("nav.sales"), href: "/sales", icon: ShoppingCart },
  { label: t("nav.alerts"), href: "/alerts", icon: Bell },
];

const settingsNavItems: NavItem[] = [
  {
    label: t("nav.users"),
    href: "/settings/users",
    icon: Users,
    permission: "users.manage",
  },
  {
    label: t("nav.roles"),
    href: "/settings/roles",
    icon: Shield,
    permission: "roles.manage",
  },
];

interface SidebarProps {
  permissions: string[];
}

export function Sidebar({ permissions }: SidebarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const user = session?.user;

  const visibleSettingsItems = settingsNavItems.filter(
    (item) => !item.permission || permissions.includes(item.permission)
  );

  return (
    <aside className="fixed left-0 top-0 z-40 flex h-full w-64 flex-col border-r border-border bg-background">
      {/* Logo / Brand */}
      <div className="flex h-14 items-center border-b border-border px-6">
        <Link href="/dashboard" className="flex items-center gap-2">
          <Package className="size-6 text-primary" />
          <span className="text-lg font-semibold tracking-tight">
            {t("brand.name")}
          </span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <div className="space-y-1">
          {mainNavItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/dashboard" && pathname.startsWith(item.href));

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <item.icon className="size-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Settings Section */}
        {visibleSettingsItems.length > 0 && (
          <div className="mt-6">
            <div className="mb-2 flex items-center gap-2 px-3">
              <Settings className="size-3.5 text-muted-foreground" />
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t("nav.settings")}
              </span>
            </div>
            <div className="space-y-1">
              {visibleSettingsItems.map((item) => {
                const isActive = pathname.startsWith(item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                      isActive
                        ? "bg-primary/10 text-primary"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <item.icon className="size-4 shrink-0" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* User Info Footer */}
      {user && (
        <div className="border-t border-border px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-sm font-medium text-primary">
              {user.name?.charAt(0).toUpperCase() ?? "U"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
