"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { t } from "@/lib/i18n";
import { UserCard, type FollowerUser } from "./user-card";

interface FollowingDrawerProps {
  userId: string;
  currentUserId: string | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCountChange?: (delta: number) => void;
}

type FetchState = "idle" | "loading" | "error" | "loaded";

export function FollowingDrawer({
  userId,
  currentUserId,
  open,
  onOpenChange,
  onCountChange,
}: FollowingDrawerProps) {
  const [items, setItems] = useState<FollowerUser[]>([]);
  const [state, setState] = useState<FetchState>("idle");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  const fetchPage = useCallback(
    async (cursor?: string) => {
      const isFirst = !cursor;
      if (isFirst) setState("loading");
      else setLoadingMore(true);

      try {
        const url = new URL("/api/following", window.location.origin);
        url.searchParams.set("userId", userId);
        if (cursor) url.searchParams.set("cursor", cursor);

        const res = await fetch(url.toString());
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json();

        setItems((prev) => (isFirst ? json.data : [...prev, ...json.data]));
        setNextCursor(json.meta.nextCursor);
        setHasNextPage(json.meta.hasNextPage);
        setState("loaded");
      } catch {
        setState("error");
      } finally {
        setLoadingMore(false);
      }
    },
    [userId]
  );

  // Fetch when drawer opens
  useEffect(() => {
    if (open) {
      setItems([]);
      setNextCursor(null);
      setHasNextPage(false);
      fetchPage();
    }
  }, [open, fetchPage]);

  const handleFollowChange = useCallback(
    (targetId: string, nowFollowing: boolean) => {
      setItems((prev) =>
        prev.map((item) =>
          item.id === targetId ? { ...item, isFollowing: nowFollowing } : item
        )
      );
      onCountChange?.(nowFollowing ? 1 : -1);
    },
    [onCountChange]
  );

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md bg-[#10141a] border-[#262a31]">
        <SheetHeader>
          <SheetTitle className="text-[#dfe2eb]">
            {t.profile.followingDrawerTitle}
          </SheetTitle>
        </SheetHeader>

        <div className="mt-4 overflow-y-auto h-[calc(100vh-6rem)]">
          {state === "loading" && (
            <div className="flex items-center justify-center py-20">
              <p className="text-[#849396] text-sm">{t.profile.loadingList}</p>
            </div>
          )}

          {state === "error" && (
            <div className="flex items-center justify-center py-20">
              <p className="text-rose-400 text-sm">{t.profile.errorLoading}</p>
            </div>
          )}

          {state === "loaded" && items.length === 0 && (
            <div className="flex items-center justify-center py-20">
              <p className="text-[#849396] text-sm">{t.profile.emptyFollowing}</p>
            </div>
          )}

          {state === "loaded" && items.length > 0 && (
            <div className="space-y-1">
              {items.map((user) => (
                <UserCard
                  key={user.id}
                  user={user}
                  currentUserId={currentUserId}
                  onFollowChange={handleFollowChange}
                />
              ))}

              {hasNextPage && (
                <div className="pt-4 pb-2 flex justify-center">
                  <button
                    onClick={() => fetchPage(nextCursor ?? undefined)}
                    disabled={loadingMore}
                    className="text-[#00e5ff] text-sm font-semibold hover:underline disabled:opacity-50"
                  >
                    {loadingMore ? "..." : t.profile.loadMore}
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
