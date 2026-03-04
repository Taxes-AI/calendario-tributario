"use client";

import { useState, useCallback } from "react";
import { useAction } from "next-safe-action/hooks";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale/es";
import { Bell, CheckCheck } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  markNotificationAsRead,
  markAllNotificationsAsRead,
} from "@/lib/actions/notifications";
import type { SerializedNotification } from "@/lib/queries/notifications";

// ─────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────

interface NotificationDropdownProps {
  notifications: SerializedNotification[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

// ─────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────

export function NotificationDropdown({
  notifications,
  open,
  onOpenChange,
  children,
}: NotificationDropdownProps) {
  // Optimistic read tracking
  const [optimisticRead, setOptimisticRead] = useState<Set<string>>(new Set());

  const { execute: executeMarkOne } = useAction(markNotificationAsRead);

  const { execute: executeMarkAll, isExecuting: isMarkingAll } = useAction(
    markAllNotificationsAsRead,
    {
      onSuccess: () => {
        toast.success("Notificaciones marcadas como leidas");
      },
      onError: () => {
        toast.error("Error al marcar notificaciones");
      },
    },
  );

  const handleMarkOne = useCallback(
    (id: string) => {
      setOptimisticRead((prev) => new Set(prev).add(id));
      executeMarkOne({ notificationId: id });
    },
    [executeMarkOne],
  );

  const handleMarkAll = useCallback(() => {
    const allIds = notifications
      .filter((n) => !n.leida)
      .map((n) => n.id);
    setOptimisticRead((prev) => {
      const next = new Set(prev);
      allIds.forEach((id) => next.add(id));
      return next;
    });
    executeMarkAll({});
  }, [notifications, executeMarkAll]);

  const isRead = (n: SerializedNotification) =>
    n.leida || optimisticRead.has(n.id);

  const hasUnread = notifications.some((n) => !isRead(n));

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>{children}</PopoverTrigger>
      <PopoverContent align="end" className="w-[calc(100vw-2rem)] p-0 sm:w-80">
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold text-gray-900">
            Notificaciones
          </h3>
          {hasUnread && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto px-2 py-1 text-xs text-gray-500 hover:text-gray-700"
              onClick={handleMarkAll}
              disabled={isMarkingAll}
            >
              <CheckCheck size={14} className="mr-1" />
              Marcar todas como leidas
            </Button>
          )}
        </div>

        {/* Notification list */}
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center px-4 py-10">
            <Bell size={32} className="mb-2 text-gray-300" />
            <p className="text-sm text-gray-400">No tienes notificaciones</p>
          </div>
        ) : (
          <div className="max-h-80 overflow-y-auto">
            {notifications.map((notification) => {
              const read = isRead(notification);
              return (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    if (!read) handleMarkOne(notification.id);
                  }}
                  className={`flex w-full items-start gap-3 border-b px-4 py-3 text-left transition-colors last:border-b-0 ${
                    read
                      ? "bg-white"
                      : "cursor-pointer bg-blue-50/50 hover:bg-blue-50"
                  }`}
                >
                  {/* Tipo indicator dot */}
                  <span
                    className={`mt-1.5 h-2 w-2 flex-shrink-0 rounded-full ${
                      notification.tipo === "VENCIDA"
                        ? "bg-red-500"
                        : "bg-amber-500"
                    }`}
                  />

                  {/* Content */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-sm leading-snug ${
                        read
                          ? "font-normal text-gray-600"
                          : "font-medium text-gray-900"
                      }`}
                    >
                      {notification.mensaje}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400">
                      {formatDistanceToNow(new Date(notification.createdAt), {
                        locale: es,
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
