"use client";

import { useState, useEffect, useCallback } from "react";
import { Loader2 } from "lucide-react";
import { NotificationItem } from "@/components/notifications/NotificationItem";
import type { NotificationGroup } from "@/lib/notifications/group";
import { t } from "@/lib/i18n";

interface NotificationResponse {
  items: NotificationGroup[];
  unreadCount: number;
  hasMore: boolean;
}

interface NotificationDropdownProps {
  onMarkAllRead: () => void;
}

export function NotificationDropdown({ onMarkAllRead }: NotificationDropdownProps) {
  const [data, setData] = useState<NotificationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (!res.ok) throw new Error("Failed to fetch");
      const json: NotificationResponse = await res.json();
      setData(json);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleItemClick = useCallback(
    async (group: NotificationGroup) => {
      // Mark the entire group as read
      try {
        await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ groupKey: group.groupKey }),
        });
      } catch {
        // Fire-and-forget
      }

      // Navigate to target if URL is available
      if (group.navigateTo) {
        window.location.href = group.navigateTo;
      }
    },
    []
  );

  const handleMarkAllRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      onMarkAllRead();
      // Refresh the list
      fetchNotifications();
    } catch {
      // Silently fail
    }
  };

  // Empty state
  if (!loading && !error && data && data.items.length === 0) {
    return (
      <div className="w-[360px] max-h-[480px] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-border">
          <h3 className="text-sm font-semibold text-foreground">
            Notificaciones
          </h3>
        </div>
        {/* Empty state message */}
        <div className="flex-1 flex items-center justify-center py-12">
          <p className="text-sm text-muted-foreground text-center px-4">
            {(t as unknown as Record<string, Record<string, string>>).notifications?.empty ??
              "No tienes notificaciones todavía"}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-[360px] max-h-[480px] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border">
        <h3 className="text-sm font-semibold text-foreground">
          Notificaciones
        </h3>
        {data && data.unreadCount > 0 && (
          <span className="text-[10px] text-muted-foreground bg-accent px-2 py-0.5 rounded-full">
            {data.unreadCount} sin leer
          </span>
        )}
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto max-h-[360px]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        ) : error ? (
          <div className="px-4 py-8 text-center">
            <p className="text-sm text-muted-foreground">
              No se pudieron cargar las notificaciones.
            </p>
          </div>
        ) : data ? (
          <div className="py-1">
            {data.items.map((group) => (
              <NotificationItem
                key={group.groupKey}
                group={group}
                onClick={handleItemClick}
              />
            ))}
          </div>
        ) : null}
      </div>

      {/* Footer: Mark all as read */}
      {data && data.items.length > 0 && (
        <div className="border-t border-border px-3 py-2">
          <button
            onClick={handleMarkAllRead}
            className="w-full text-center text-xs text-cyan-400 hover:text-cyan-300 transition-colors py-1"
          >
            {(t as unknown as Record<string, Record<string, string>>).notifications?.markAllRead ??
              "Marcar todas como le\u00eddas"}
          </button>
        </div>
      )}
    </div>
  );
}
