import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface ReviewListCardProps {
  tmdbId: number;
  mediaType: "movie" | "tv";
  title: string;
  posterPath: string | null;
  genre: string;
  year: number | null;
  score: number;
  review: string;
  updatedAt: Date;
}

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return t.title.timeAgoMinutes(mins);
  if (hrs < 24) return t.title.timeAgoHours(hrs);
  if (days === 1) return t.title.yesterday;
  if (days < 30) return t.title.timeAgoDays(days);
  return t.title.timeAgoMonths(Math.floor(days / 30));
}

export function ReviewListCard({
  tmdbId,
  mediaType,
  title,
  posterPath,
  genre,
  year,
  score,
  review,
  updatedAt,
}: ReviewListCardProps) {
  const imgSrc = posterPath ? posterUrl(posterPath, "w185") : null;

  const scoreColor =
    score >= 8
      ? "text-emerald-400 border-emerald-500/30 bg-emerald-500/10"
      : score >= 6
        ? "text-yellow-400 border-yellow-500/30 bg-yellow-500/10"
        : "text-rose-400 border-rose-500/30 bg-rose-500/10";

  const scoreBg =
    score >= 8
      ? "bg-emerald-500/10 border-emerald-500/20"
      : score >= 6
        ? "bg-yellow-500/10 border-yellow-500/20"
        : "bg-rose-500/10 border-rose-500/20";

  return (
    <div className="flex gap-5 p-5 rounded-2xl bg-[#181c22] border border-white/[0.04] hover:bg-[#1c2026] transition-colors group">

      {/* Póster */}
      <Link
        href={`/title/${mediaType}/${tmdbId}`}
        className="flex-shrink-0 w-16 h-24 rounded-xl overflow-hidden bg-[#262a31] relative shadow-lg group-hover:shadow-primary/10 transition-shadow"
      >
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover"
            sizes="64px"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-950" />
        )}
      </Link>

      {/* Contenido */}
      <div className="flex-1 min-w-0 flex flex-col justify-between gap-2">
        {/* Fila superior: título + score */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <Link href={`/title/${mediaType}/${tmdbId}`}>
              <h4 className="font-bold text-[#dfe2eb] text-base leading-tight hover:text-[#00e5ff] transition-colors line-clamp-1">
                {title}
              </h4>
            </Link>
            <p className="text-[11px] text-[#849396] uppercase tracking-widest font-medium mt-0.5">
              {genre}{year ? ` · ${year}` : ""} · {mediaType === "movie" ? t.title.movie : t.title.tv}
            </p>
          </div>

          {/* Score badge */}
          <div className={cn(
            "flex-shrink-0 flex items-baseline gap-0.5 px-3 py-1.5 rounded-xl border",
            scoreBg
          )}>
            <span className={cn("text-lg font-black leading-none", scoreColor.split(" ")[0])}>
              {score}
            </span>
            <span className="text-[10px] text-[#849396]">/10</span>
          </div>
        </div>

        {/* Texto de la review */}
        <p className="text-sm text-[#849396] leading-relaxed italic line-clamp-2">
          &ldquo;{review}&rdquo;
        </p>

        {/* Fecha */}
        <p className="text-[10px] text-[#849396]/60 uppercase tracking-widest font-medium">
          {timeAgo(updatedAt)}
        </p>
      </div>
    </div>
  );
}
