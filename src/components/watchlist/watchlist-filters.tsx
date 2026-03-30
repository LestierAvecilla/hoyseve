"use client";

import { useState } from "react";
import { ChevronDown, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

type TabOption = "movies" | "anime";
type SortOption = "date" | "release" | "rating";
type GenreOption = "all" | "sci-fi" | "cyberpunk" | "drama";

interface WatchlistFiltersProps {
  totalCount: number;
}

export function WatchlistFilters({ totalCount }: WatchlistFiltersProps) {
  const [activeTab, setActiveTab] = useState<TabOption>("movies");
  const [sort, setSort] = useState<SortOption>("date");
  const [genre, setGenre] = useState<GenreOption>("all");

  const SORT_LABELS: Record<SortOption, string> = {
    date: `${t.watchlist.sort.label} ${t.watchlist.sort.date}`,
    release: `${t.watchlist.sort.label} ${t.watchlist.sort.release}`,
    rating: `${t.watchlist.sort.label} ${t.watchlist.sort.rating}`,
  };

  const GENRE_LABELS: Record<GenreOption, string> = {
    all: `${t.watchlist.genre.label} ${t.watchlist.genre.all}`,
    "sci-fi": t.watchlist.genre.scifi,
    cyberpunk: t.watchlist.genre.cyberpunk,
    drama: t.watchlist.genre.drama,
  };

  const TAB_LABELS: Record<TabOption, string> = {
    movies: t.watchlist.tabs.movies,
    anime: t.watchlist.tabs.anime,
  };

  return (
    <div className="bg-card rounded-xl px-6 py-4 mb-10 flex flex-wrap items-center justify-between gap-4 border border-border">
      <div className="flex items-center gap-6 flex-wrap">
        {/* Tabs Películas / Anime */}
        <div className="flex border-b border-border gap-1">
          {(["movies", "anime"] as TabOption[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={cn(
                "px-5 py-2.5 text-xs font-bold uppercase tracking-wider transition-all",
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Divider */}
        <div className="h-6 w-px bg-border hidden sm:block" />

        {/* Selects */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Sort */}
          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className={cn(
                "appearance-none bg-muted border border-border rounded-lg",
                "pl-4 pr-8 py-2 text-xs font-semibold uppercase tracking-wider",
                "text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              )}
            >
              <option value="date">{SORT_LABELS.date}</option>
              <option value="release">{SORT_LABELS.release}</option>
              <option value="rating">{SORT_LABELS.rating}</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>

          {/* Genre */}
          <div className="relative">
            <select
              value={genre}
              onChange={(e) => setGenre(e.target.value as GenreOption)}
              className={cn(
                "appearance-none bg-muted border border-border rounded-lg",
                "pl-4 pr-8 py-2 text-xs font-semibold uppercase tracking-wider",
                "text-foreground focus:outline-none focus:ring-1 focus:ring-primary/40 cursor-pointer"
              )}
            >
              <option value="all">{GENRE_LABELS.all}</option>
              <option value="sci-fi">{GENRE_LABELS["sci-fi"]}</option>
              <option value="cyberpunk">{GENRE_LABELS.cyberpunk}</option>
              <option value="drama">{GENRE_LABELS.drama}</option>
            </select>
            <ChevronDown
              size={14}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            />
          </div>
        </div>
      </div>

      {/* Contador */}
      <div className="flex items-center gap-1.5 text-muted-foreground text-xs font-medium">
        <Info size={13} />
        <span>{t.watchlist.titlesSaved(totalCount)}</span>
      </div>
    </div>
  );
}
