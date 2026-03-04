"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { APP_NAME } from "@/lib/utils/constants";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { NotificationDropdown } from "@/components/notifications/notification-dropdown";
import type { SerializedNotification } from "@/lib/queries/notifications";

interface NavBarProps {
  userName: string;
  userEmail: string;
  unreadCount: number;
  notifications: SerializedNotification[];
}

const NAV_LINKS = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/perfil", label: "Perfil" },
  { href: "/sanciones", label: "Sanciones" },
] as const;

export function NavBar({ userName, userEmail, unreadCount, notifications }: NavBarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [notifOpen, setNotifOpen] = useState(false);

  async function handleLogout() {
    await authClient.signOut();
    router.push("/login");
  }

  return (
    <nav className="border-b bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <div className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-lg font-semibold text-gray-900"
          >
            {APP_NAME}
          </Link>
          <div className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm transition-colors hover:bg-gray-100",
                  pathname === link.href
                    ? "font-medium text-gray-900"
                    : "text-gray-500 hover:text-gray-700",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-4">
          <NotificationDropdown
            notifications={notifications}
            open={notifOpen}
            onOpenChange={setNotifOpen}
          >
            <NotificationBell
              unreadCount={unreadCount}
              onClick={() => setNotifOpen((prev) => !prev)}
            />
          </NotificationDropdown>
          <span className="hidden text-sm text-gray-600 sm:inline">
            {userName || userEmail}
          </span>
          <Button variant="outline" size="sm" onClick={handleLogout}>
            Cerrar sesion
          </Button>
        </div>
      </div>
    </nav>
  );
}
