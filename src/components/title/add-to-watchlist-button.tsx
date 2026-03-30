"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Bookmark, Loader2, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface AddToWatchlistButtonProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
}

export function AddToWatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
}: AddToWatchlistButtonProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  // Check if already in watchlist on mount
  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }

    fetch(`/api/watchlist/check?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((r) => r.json())
      .then((data) => {
        if (data?.inWatchlist !== undefined) {
          setInWatchlist(Boolean(data.inWatchlist));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [status, tmdbId, mediaType]);

  async function handleClick() {
    if (status === "unauthenticated") {
      router.push(`/login?callbackUrl=/title/${mediaType}/${tmdbId}`);
      return;
    }
    if (busy || loading) return;

    setBusy(true);
    // Optimistic update
    const wasIn = inWatchlist;
    setInWatchlist(!wasIn);

    try {
      if (wasIn) {
        const res = await fetch(
          `/api/watchlist?tmdbId=${tmdbId}&mediaType=${mediaType}`,
          { method: "DELETE" }
        );
        if (!res.ok) setInWatchlist(wasIn); // rollback
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, mediaType, title, posterPath }),
        });
        if (!res.ok) setInWatchlist(wasIn); // rollback
      }
    } catch {
      setInWatchlist(wasIn); // rollback on network error
    } finally {
      setBusy(false);
    }
  }

  const isAdded = inWatchlist && !loading;

  return (
    <button
      onClick={handleClick}
      disabled={busy || (loading && status === "authenticated")}
      className={cn(
        "flex items-center gap-2.5 font-bold px-8 py-4 rounded-xl shadow-lg transition-all text-sm uppercase tracking-wider",
        "active:scale-95 disabled:cursor-not-allowed",
        isAdded
          ? "bg-primary/20 text-primary border border-primary/40 hover:bg-rose-500/20 hover:text-rose-400 hover:border-rose-500/40"
          : "bg-gradient-to-br from-primary to-cyan-300 text-primary-foreground shadow-primary/20 hover:scale-105"
      )}
    >
      {busy ? (
        <Loader2 size={16} className="animate-spin" />
      ) : isAdded ? (
        <Check size={16} />
      ) : (
        <Bookmark size={16} className="fill-current" />
      )}
      {busy
        ? isAdded
          ? t.title.removing
          : t.title.adding
        : isAdded
          ? t.title.inWatchlist
          : t.title.addToWatchlist}
    </button>
  );
}
