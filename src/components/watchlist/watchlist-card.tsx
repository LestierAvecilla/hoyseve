"use client";

import { useState } from "react";
import { Check, Trash2, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface WatchlistCardProps {
  id: number;
  title: string;
  rating: number;
  category: string;
  addedLabel: string;
  qualityBadge?: string;
  gradient: string;
}

export function WatchlistCard({
  id,
  title,
  rating,
  category,
  addedLabel,
  qualityBadge,
  gradient,
}: WatchlistCardProps) {
  const [watched, setWatched] = useState(false);
  const [removed, setRemoved] = useState(false);

  if (removed) return null;

  return (
    <div
      className={cn(
        "group relative aspect-[2/3] rounded-xl overflow-hidden bg-card shadow-xl",
        "transition-all duration-500 hover:-translate-y-2 hover:shadow-primary/10 hover:shadow-2xl"
      )}
    >
      {/* Fondo / póster placeholder */}
      <div
        className={cn(
          "absolute inset-0 bg-gradient-to-b",
          gradient,
          "transition-transform duration-700 group-hover:scale-110"
        )}
      />

      {/* Degradado inferior para legibilidad */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent" />

      {/* Badge calidad (top-left) */}
      {qualityBadge && (
        <div className="absolute top-3 left-3">
          <span className="bg-background/80 backdrop-blur-md px-2 py-1 rounded-md text-[10px] font-bold text-primary tracking-widest uppercase">
            {qualityBadge}
          </span>
        </div>
      )}

      {/* Badge "Added X ago" — aparece en hover desde la derecha */}
      <div className="absolute top-3 right-3 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300">
        <span className="bg-primary text-primary-foreground px-2 py-1 rounded-md text-[10px] font-bold shadow-lg whitespace-nowrap">
          {addedLabel}
        </span>
      </div>

      {/* Info inferior */}
      <div className="absolute bottom-0 left-0 right-0 p-4 flex flex-col">
        <Link href={`/title/${id}`}>
          <h3 className="font-bold text-base text-white leading-tight mb-1 hover:text-primary transition-colors">
            {title}
          </h3>
        </Link>
        <p className="text-xs text-white/60 font-medium flex items-center gap-1.5 mb-4">
          <Star size={11} className="text-yellow-400 fill-yellow-400" />
          <span>{rating}</span>
          <span className="text-white/30">•</span>
          <span>{category}</span>
        </p>

        {/* Hover controls */}
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <button
            onClick={() => setWatched(true)}
            className={cn(
              "flex-1 backdrop-blur-md border py-2 rounded-lg flex items-center justify-center transition-all",
              watched
                ? "bg-emerald-500/30 border-emerald-500/50 text-emerald-400"
                : "bg-card/80 border-border hover:bg-emerald-500/20 hover:border-emerald-500/40 hover:text-emerald-400 text-muted-foreground"
            )}
            title="Marcar como visto"
          >
            <Check size={16} strokeWidth={2.5} />
          </button>
          <button
            onClick={() => setRemoved(true)}
            className="flex-1 bg-card/80 backdrop-blur-md border border-border hover:bg-destructive/20 hover:border-destructive/40 hover:text-destructive text-muted-foreground py-2 rounded-lg flex items-center justify-center transition-all"
            title="Eliminar de watchlist"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
