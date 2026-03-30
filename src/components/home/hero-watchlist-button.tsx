"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Plus, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface HeroWatchlistButtonProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
}

export function HeroWatchlistButton({
  tmdbId,
  mediaType,
  title,
  posterPath,
}: HeroWatchlistButtonProps) {
  const { status } = useSession();
  const router = useRouter();

  const [inWatchlist, setInWatchlist] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated") {
      setLoading(false);
      return;
    }
    fetch(`/api/watchlist/check?tmdbId=${tmdbId}&mediaType=${mediaType}`)
      .then((r) => r.json())
      .then((data) => setInWatchlist(Boolean(data?.inWatchlist)))
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
    const wasIn = inWatchlist;
    setInWatchlist(!wasIn);

    try {
      if (wasIn) {
        const res = await fetch(
          `/api/watchlist?tmdbId=${tmdbId}&mediaType=${mediaType}`,
          { method: "DELETE" }
        );
        if (!res.ok) setInWatchlist(wasIn);
      } else {
        const res = await fetch("/api/watchlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tmdbId, mediaType, title, posterPath }),
        });
        if (!res.ok) setInWatchlist(wasIn);
      }
    } catch {
      setInWatchlist(wasIn);
    } finally {
      setBusy(false);
    }
  }

  const isAdded = inWatchlist && !loading;

  return (
    <button
      onClick={handleClick}
      disabled={busy}
      className={cn(
        "flex items-center gap-2 px-6 py-3 rounded-lg border text-sm font-semibold transition-all active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed",
        isAdded
          ? "border-primary/40 bg-primary/10 text-primary"
          : "border-border bg-white/5 text-foreground hover:bg-white/10"
      )}
    >
      {busy ? (
        <Loader2 size={15} className="animate-spin" />
      ) : isAdded ? (
        <Check size={15} />
      ) : (
        <Plus size={15} />
      )}
      {isAdded ? t.title.inWatchlist : t.nav.watchlist}
    </button>
  );
}
