import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import { t } from "@/lib/i18n";

export interface SimilarTitle {
  id: number;
  name: string;
  genre: string;
  year: number;
  posterPath: string | null;
  mediaType: "movie" | "tv";
}

interface SimilarTitlesProps {
  titles: SimilarTitle[];
}

export function SimilarTitles({ titles }: SimilarTitlesProps) {
  return (
    <div className="space-y-4">
      <h4 className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
        {t.title.similarTitles}
      </h4>
      <div className="flex flex-col gap-3">
        {titles.map((title) => (
          <Link
            key={title.id}
            href={`/title/${title.mediaType}/${title.id}`}
            className="flex items-center gap-4 group"
          >
            {/* Miniatura */}
            <div className="w-16 h-20 rounded-lg flex-shrink-0 overflow-hidden border border-border bg-card relative">
              {title.posterPath ? (
                <Image
                  src={posterUrl(title.posterPath, "w185")}
                  alt={title.name}
                  fill
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                  sizes="64px"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
              )}
            </div>
            <div>
              <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">
                {title.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {title.genre} • {title.year}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
