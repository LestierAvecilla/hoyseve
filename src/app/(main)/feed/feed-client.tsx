"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { ActivityCard } from "@/components/feed/activity-card";
import { t } from "@/lib/i18n";
import { Users, Globe } from "lucide-react";

type ReactionType = "hype" | "sadness" | "plot_twist" | "skip";
type ReactionSummary = Partial<Record<ReactionType, number>>;

type Activity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userHandle: string | null;
  type: "rating" | "review" | "watchlist_add";
  tmdbId: number;
  mediaType: "movie" | "tv" | "anime";
  source: "tmdb" | "anilist";
  score: number | null;
  review: string | null;
  title: string;
  posterPath: string | null;
  createdAt: string;
  ratingId?: string | null;
  reactionSummary?: ReactionSummary;
  userReaction?: ReactionType | null;
};

type FeedMeta = {
  nextCursor: string | null;
  hasNextPage: boolean;
};

export function FeedClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const filter = searchParams.get("filter") ?? "following";

  const [activities, setActivities] = useState<Activity[]>([]);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  const setFilter = useCallback(
    (newFilter: string) => {
      router.push(`/feed?filter=${newFilter}`);
    },
    [router],
  );

  const fetchActivities = useCallback(
    async (
      activeFilter: string,
      cursorParam?: string,
    ): Promise<{ data: Activity[]; meta: FeedMeta } | null> => {
      const url = new URL("/api/feed", window.location.origin);
      url.searchParams.set("filter", activeFilter);
      if (cursorParam) {
        url.searchParams.set("cursor", cursorParam);
      }

      const res = await fetch(url.toString());
      if (!res.ok) return null;
      return res.json();
    },
    [],
  );

  useEffect(() => {
    let cancelled = false;

    fetchActivities(filter).then((data) => {
      if (cancelled) return;
      setLoading(false);
      setActivities(data?.data ?? []);
      setCursor(data?.meta.nextCursor ?? null);
      setHasNextPage(data?.meta.hasNextPage ?? false);
    });

    return () => {
      cancelled = true;
      setLoading(true);
      setActivities([]);
      setCursor(null);
      setHasNextPage(false);
    };
  }, [filter, fetchActivities]);

  const loadMore = useCallback(async () => {
    if (!cursor || loadingMore) return;
    setLoadingMore(true);

    const data = await fetchActivities(filter, cursor);
    if (data) {
      setActivities((prev) => [...prev, ...data.data]);
      setCursor(data.meta.nextCursor);
      setHasNextPage(data.meta.hasNextPage);
    }
    setLoadingMore(false);
  }, [cursor, filter, loadingMore, fetchActivities]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{t.feed.title}</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setFilter("following")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              filter === "following"
                ? "bg-[#00e5ff] text-[#0d1117]"
                : "bg-[#181c22] hover:bg-[#1c2026] text-[#849396] border border-white/5"
            }`}
          >
            <Users size={16} />
            {t.feed.following}
          </button>
          <button
            onClick={() => setFilter("global")}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium ${
              filter === "global"
                ? "bg-[#00e5ff] text-[#0d1117]"
                : "bg-[#181c22] hover:bg-[#1c2026] text-[#849396] border border-white/5"
            }`}
          >
            <Globe size={16} />
            {t.feed.global}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-pulse text-[#849396]">{t.feed.loading}</div>
        </div>
      ) : activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-[#181c22] rounded-2xl border border-white/5">
          <p className="text-[#849396] text-sm">
            {filter === "following"
              ? t.feed.noActivityFollowing
              : t.feed.noActivityGlobal}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}

          {hasNextPage && (
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="w-full py-3 bg-[#181c22] hover:bg-[#1c2026] rounded-xl border border-white/5 transition-colors text-sm text-[#849396] disabled:opacity-50"
            >
              {loadingMore ? t.feed.loading : t.feed.loadMore}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
