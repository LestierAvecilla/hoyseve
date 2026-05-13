"use client";

import { useState, useEffect, useCallback } from "react";
import { Bell } from "lucide-react";
import { useSession } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuPositioner,
  DropdownMenuPopup,
} from "@/components/ui/dropdown-menu";
import { NotificationDropdown } from "@/components/notifications/NotificationDropdown";

export function NotificationBell() {
  const { data: session } = useSession();
  const [unreadCount, setUnreadCount] = useState(0);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const fetchUnreadCount = useCallback(async () => {
    if (!session?.user?.id) return;
    try {
      const res = await fetch("/api/notifications/unread-count");
      if (!res.ok) return;
      const data = await res.json();
      setUnreadCount(data.count ?? 0);
    } catch {
      // Silently fail
    }
  }, [session?.user?.id]);

  // Fetch on mount
  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Poll on visibility change
  useEffect(() => {
    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        fetchUnreadCount();
      }
    }

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [fetchUnreadCount]);

  const handleMarkAllRead = useCallback(() => {
    setUnreadCount(0);
  }, []);

  const badgeLabel =
    unreadCount === 0
      ? null
      : unreadCount > 99
        ? "99+"
        : String(unreadCount);

  // Hidden when guest
  if (!session?.user?.id) return null;

  return (
    <DropdownMenu
      open={dropdownOpen}
      onOpenChange={(open: boolean) => {
        setDropdownOpen(open);
        if (open) {
          fetchUnreadCount();
        }
      }}
    >
      <DropdownMenuTrigger className="relative p-1.5 rounded-full hover:bg-accent transition-colors">
        <Bell size={18} className="text-muted-foreground" />
        {badgeLabel && (
          <span
            className={`
              absolute -top-0.5 -right-0.5
              min-w-[18px] h-[18px] flex items-center justify-center
              rounded-full bg-cyan-500 text-white
              text-[10px] font-bold leading-none
              px-1
            `}
          >
            {badgeLabel}
          </span>
        )}
      </DropdownMenuTrigger>

      <DropdownMenuPositioner align="end" sideOffset={12}>
        <DropdownMenuPopup className="w-[360px] p-0 max-h-[480px] overflow-hidden">
          <NotificationDropdown onMarkAllRead={handleMarkAllRead} />
        </DropdownMenuPopup>
      </DropdownMenuPositioner>
    </DropdownMenu>
  );
}
