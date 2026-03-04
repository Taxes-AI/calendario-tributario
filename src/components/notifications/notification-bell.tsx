"use client";

import { Bell } from "lucide-react";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface NotificationBellProps {
  unreadCount: number;
  onClick: () => void;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function NotificationBell({ unreadCount, onClick }: NotificationBellProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Notificaciones"
      aria-haspopup="true"
      className="relative rounded-md p-1.5 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700"
    >
      <Bell size={20} />
      {unreadCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
          {unreadCount > 99 ? "99+" : unreadCount}
        </span>
      )}
    </button>
  );
}
