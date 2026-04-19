import Image from "next/image";
import Link from "next/link";
import { posterUrl } from "@/lib/tmdb";
import { t } from "@/lib/i18n";

type Source = "tmdb" | "anilist";

interface HallOfFameItem {
  tmdbId: number;
  source: Source;
  mediaType: "movie" | "tv" | "anime";
  title: string;
  posterPath: string | null;
  score: number;
}

interface HallOfFameProps {
  items: HallOfFameItem[];
}

const FALLBACK_GRADIENTS = [
  "from-cyan-900 via-teal-950 to-slate-950",
  "from-indigo-900 via-blue-950 to-slate-950",
  "from-violet-900 via-purple-950 to-slate-950",
  "from-rose-900 via-red-950 to-slate-950",
  "from-amber-900 via-orange-950 to-slate-950",
  "from-emerald-900 via-green-950 to-slate-950",
];

export function HallOfFame({ items }: HallOfFameProps) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="px-8 py-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-8 h-8 rounded-lg bg-[#00e5ff]/20 flex items-center justify-center">
          <span className="text-[#00e5ff] text-lg">★</span>
        </div>
        <h3 className="text-xl font-black text-[#dfe2eb]">{t.profile.hallOfFame}</h3>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {items.map((item, index) => {
          const imgSrc = item.posterPath
            ? item.source === "tmdb"
              ? posterUrl(item.posterPath, "w342")
              : item.posterPath
            : null;
          const fallback = FALLBACK_GRADIENTS[index % FALLBACK_GRADIENTS.length];
          const href =
            item.source === "anilist"
              ? `/anime/${item.tmdbId}`
              : `/title/${item.mediaType}/${item.tmdbId}`;

          const scoreColor =
            item.score >= 8
              ? "text-emerald-400"
              : item.score >= 6
                ? "text-yellow-400"
                : "text-rose-400";

          return (
            <div key={`${item.mediaType}-${item.tmdbId}`} className="flex flex-col items-center gap-2 flex-shrink-0">
              {/* Rank badge — outside the poster */}
              <div className="w-6 h-6 rounded-full bg-[#00e5ff] text-[#001f24] font-black text-xs flex items-center justify-center shadow-lg">
                {index + 1}
              </div>

              <Link
                href={href}
                className="group relative w-32 aspect-[2/3] rounded-2xl overflow-hidden shadow-xl transition-all duration-300 hover:-translate-y-2"
              >
                {/* Poster or gradient */}
                {imgSrc ? (
                  <Image
                    src={imgSrc}
                    alt={item.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                    sizes="128px"
                  />
                ) : (
                  <div className={`absolute inset-0 bg-gradient-to-b ${fallback}`} />
                )}

                {/* Overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                  <p className="font-bold text-white text-xs leading-tight line-clamp-2">
                    {item.title}
                  </p>
                </div>

                {/* Always-visible bottom gradient for score badge */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                {/* Score badge */}
                <div className="absolute top-2 left-2 px-2 py-1 rounded-lg border border-white/10 shadow-lg bg-black/60 backdrop-blur-md">
                  <span className={`text-[0.6875rem] font-black tracking-tight ${scoreColor}`}>
                    ★ {item.score}/10
                  </span>
                </div>
              </Link>
            </div>
          );
        })}
      </div>
    </section>
  );
}
