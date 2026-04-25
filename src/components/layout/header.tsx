"use client";

import Link from "next/link";
import { useSession, useLogout } from "@/hooks/use-session";
import { Bell, LogOut, User } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { t } from "@/lib/locales";

interface HeaderProps {
  title: string;
  alertCount?: number;
}

export function Header({ title, alertCount }: HeaderProps) {
  const { user } = useSession();
  const logout = useLogout();

  const initials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-background px-6">
      {/* Page Title */}
      <h1 className="text-lg font-semibold">{title}</h1>

      {/* Right Side Actions */}
      <div className="flex items-center gap-2">
        {/* Notification Bell */}
        <Link href="/alerts" className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "relative")}>
            <Bell className="size-4" />
            {alertCount != null && alertCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -right-1 -top-1 flex size-5 items-center justify-center p-0 text-[10px]"
              >
                {alertCount > 99 ? "99+" : alertCount}
              </Badge>
            )}
            <span className="sr-only">{t("nav.srAlerts")}</span>
        </Link>

        {/* User Dropdown */}
        <DropdownMenu>
          <DropdownMenuTrigger>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar size="sm">
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
              <span className="sr-only">{t("nav.srUserMenu")}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" sideOffset={8}>
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user?.name}</span>
                <span className="text-xs text-muted-foreground">
                  {user?.email}
                </span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              <Link href="/profile" className="flex items-center gap-2">
                <User className="size-4" />
                {t("nav.profile")}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => logout()}
              className="flex items-center gap-2"
            >
              <LogOut className="size-4" />
              {t("nav.signOut")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
