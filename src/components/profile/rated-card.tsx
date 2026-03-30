import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";

type Source = "tmdb" | "anilist";

interface RatedCardProps {
  tmdbId: number;
  source: Source;
  mediaType: "movie" | "tv" | "anime";
  title: string;
  genre: string;
  year: number | null;
  score: number;
  posterPath: string | null;
  userName: string;
}

const FALLBACK_GRADIENTS = [
  "from-cyan-900 via-teal-950 to-slate-950",
  "from-indigo-900 via-blue-950 to-slate-950",
  "from-violet-900 via-purple-950 to-slate-950",
  "from-rose-900 via-red-950 to-slate-950",
  "from-amber-900 via-orange-950 to-slate-950",
  "from-emerald-900 via-green-950 to-slate-950",
];

export function RatedCard({
  tmdbId,
  source,
  mediaType,
  title,
  genre,
  year,
  score,
  posterPath,
  userName,
}: RatedCardProps) {
  const imgSrc = posterPath ? (source === "tmdb" ? posterUrl(posterPath, "w342") : posterPath) : null;
  const fallback = FALLBACK_GRADIENTS[tmdbId % FALLBACK_GRADIENTS.length];
  const href = source === "anilist" ? `/anime/${tmdbId}` : `/title/${mediaType}/${tmdbId}`;

  const scoreColor =
    score >= 8
      ? "text-emerald-400"
      : score >= 6
        ? "text-yellow-400"
        : "text-rose-400";

  return (
    <Link href={href}>
      <div className="group relative aspect-[2/3] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2">
        {/* Poster or gradient */}
        {imgSrc ? (
          <Image
            src={imgSrc}
            alt={title}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 16vw"
          />
        ) : (
          <div className={`absolute inset-0 bg-gradient-to-b ${fallback}`} />
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-4">
          <p className="font-bold text-white text-sm leading-tight line-clamp-2">{title}</p>
          <p className="text-primary text-[0.6875rem] uppercase tracking-wide mt-1">
            {genre}
            {year ? ` • ${year}` : ""}
          </p>
        </div>

        {/* Always-visible bottom gradient for score badge */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

        {/* Score badge */}
        <div className="absolute top-2.5 left-2.5 px-2 py-1 rounded-lg border border-white/10 shadow-lg bg-black/60 backdrop-blur-md">
          <span className={`text-[0.6875rem] font-black tracking-tight ${scoreColor}`}>
            {userName.split(" ")[0]} {score}/10
          </span>
        </div>
      </div>
    </Link>
  );
}
