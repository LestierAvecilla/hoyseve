"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Trash2, Loader2 } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type WatchlistItem = {
  id: string;
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  watched: boolean;
  addedAt: Date;
};

function formatAddedLabel(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${t.watchlist.added} ${mins}min`;
  if (hrs < 24) return `${t.watchlist.added} ${hrs}h`;
  if (days < 30) return `${t.watchlist.added} ${days}d`;
  return `${t.watchlist.added} ${Math.floor(days / 30)}mes`;
}

export function WatchlistItemCard({ item }: { item: WatchlistItem }) {
  const [watched, setWatched] = useState(item.watched);
  const [removed, setRemoved] = useState(false);
  const [watchBusy, setWatchBusy] = useState(false);
  const [removeBusy, setRemoveBusy] = useState(false);

  const imgSrc = item.posterPath ? posterUrl(item.posterPath, "w342") : null;
  const addedLabel = formatAddedLabel(item.addedAt);

  async function toggleWatched() {
    if (watchBusy) return;
    setWatchBusy(true);
    const next = !watched;
    setWatched(next); // optimistic
    try {
      const res = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tmdbId: item.tmdbId,
          mediaType: item.mediaType,
          watched: next,
        }),
      });
      if (!res.ok) setWatched(!next); // rollback
    } catch {
      setWatched(!next);
    } finally {
      setWatchBusy(false);
    }
  }

  async function handleRemove() {
    if (removeBusy) return;
    setRemoveBusy(true);
    try {
      const res = await fetch(
        `/api/watchlist?tmdbId=${item.tmdbId}&mediaType=${item.mediaType}`,
        { method: "DELETE" }
      );
      if (res.ok) setRemoved(true);
    } catch {
      // silently fail
    } finally {
      setRemoveBusy(false);
    }
  }

  if (removed) return null;

  return (
    <div
      className={cn(
        "group relative aspect-[2/3] rounded-xl overflow-hidden bg-card shadow-xl",
        "transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10 hover:shadow-2xl"
      )}
    >
      {/* Poster */}
      {imgSrc ? (
        <Image
          src={imgSrc}
          alt={item.title}
          fill
          className="object-cover transition-transform duration-700 group-hover:scale-110"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
        />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950" />
      )}

      {/* Bottom gradient */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Watched badge */}
      {watched && (
        <div className="absolute top-3 left-3">
            <span className="bg-emerald-500/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-white tracking-widest uppercase">
            {t.watchlist.watched}
          </span>
        </div>
      )}

      {/* Added label on hover */}
      <div className="absolute top-3 right-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap">
          {addedLabel}
        </span>
      </div>

      {/* Action buttons — appear on hover */}
      <div className="absolute top-3 left-3 flex flex-col gap-2 translate-x-[-60px] opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        {/* Only show if not already showing watched badge in top-left */}
        {!watched && (
          <button
            onClick={toggleWatched}
            disabled={watchBusy}
            title={t.watchlist.markWatched}
            className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-emerald-500/80 hover:border-emerald-500/40 transition-all disabled:opacity-50"
          >
            {watchBusy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <Eye size={13} />
            )}
          </button>
        )}
        {watched && (
          <button
            onClick={toggleWatched}
            disabled={watchBusy}
            title={t.watchlist.markUnwatched}
            className="w-8 h-8 rounded-lg bg-emerald-500/80 backdrop-blur-md border border-emerald-500/40 flex items-center justify-center text-white hover:bg-black/60 hover:border-white/10 transition-all disabled:opacity-50"
          >
            {watchBusy ? (
              <Loader2 size={12} className="animate-spin" />
            ) : (
              <EyeOff size={13} />
            )}
          </button>
        )}
        <button
          onClick={handleRemove}
          disabled={removeBusy}
          title={t.watchlist.removeFromWatchlist}
          className="w-8 h-8 rounded-lg bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center text-white hover:bg-rose-500/80 hover:border-rose-500/40 transition-all disabled:opacity-50"
        >
          {removeBusy ? (
            <Loader2 size={12} className="animate-spin" />
          ) : (
            <Trash2 size={13} />
          )}
        </button>
      </div>

      {/* Info */}
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <Link href={`/title/${item.mediaType}/${item.tmdbId}`}>
          <h3 className="font-bold text-base text-white leading-tight mb-1 hover:text-primary transition-colors line-clamp-2">
            {item.title}
          </h3>
        </Link>
        <p className="text-xs text-white/60 font-medium uppercase tracking-wider">
          {item.mediaType === "movie" ? t.search.movie : t.search.tvSeries}
        </p>
      </div>
    </div>
  );
}
