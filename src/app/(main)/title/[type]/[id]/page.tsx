import Image from "next/image";
import { notFound } from "next/navigation";
import { Star } from "lucide-react";
import { RatingPanel } from "@/components/title/rating-panel";
import { ReviewCard } from "@/components/title/review-card";
import { SimilarTitles } from "@/components/title/similar-titles";
import { AddToWatchlistButton } from "@/components/title/add-to-watchlist-button";
import {
  getMovieDetail,
  getTVDetail,
  getMovieCredits,
  getTVCredits,
  getSimilarMovies,
  getSimilarTV,
  posterUrl,
  backdropUrl,
  formatRuntime,
  formatDate,
  GENRE_MAP,
} from "@/lib/tmdb";
import { db } from "@/lib/db";
import { ratings, users } from "@/lib/schema";
import { eq, and, isNotNull, desc } from "drizzle-orm";
import { t } from "@/lib/i18n";

type MediaType = "movie" | "tv";

function isValidType(type: string): type is MediaType {
  return type === "movie" || type === "tv";
}

export default async function TitlePage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;

  if (!isValidType(type)) notFound();

  let title!: string;
  let overview!: string;
  let poster_path!: string | null;
  let backdrop_path!: string | null;
  let vote_average!: number;
  let releaseDate!: string;
  let runtime!: string;
  let genres!: string[];
  let tagline!: string;
  let studios!: string[];
  let director!: string;
  let cast!: { id: number; name: string; character: string }[];
  let similarTitles!: { id: number; name: string; genre: string; year: number; posterPath: string | null; mediaType: MediaType }[];

  try {
    if (type === "movie") {
      const [detail, credits, similar] = await Promise.all([
        getMovieDetail(id),
        getMovieCredits(id),
        getSimilarMovies(id),
      ]);
      title = detail.title;
      overview = detail.overview;
      poster_path = detail.poster_path;
      backdrop_path = detail.backdrop_path;
      vote_average = detail.vote_average;
      releaseDate = formatDate(detail.release_date);
      runtime = formatRuntime(detail.runtime);
      genres = detail.genres.map((g) => g.name);
      tagline = detail.tagline;
      studios = detail.production_companies.slice(0, 3).map((c) => c.name);
      director = credits.crew.find((c) => c.job === "Director")?.name ?? t.title.notAvailable;
      cast = credits.cast.slice(0, 6);
      similarTitles = similar.map((m) => ({
        id: m.id,
        name: m.title,
        genre: m.genre_ids[0] ? (GENRE_MAP[m.genre_ids[0]] ?? t.title.movie) : t.title.movie,
        year: m.release_date ? new Date(m.release_date).getFullYear() : 0,
        posterPath: m.poster_path,
        mediaType: "movie" as MediaType,
      }));
    } else {
      const [detail, credits, similar] = await Promise.all([
        getTVDetail(id),
        getTVCredits(id),
        getSimilarTV(id),
      ]);
      title = detail.name;
      overview = detail.overview;
      poster_path = detail.poster_path;
      backdrop_path = detail.backdrop_path;
      vote_average = detail.vote_average;
      releaseDate = formatDate(detail.first_air_date);
      const avgEp = detail.episode_run_time[0] ?? null;
      runtime = avgEp
          ? `${t.title.seasons(detail.number_of_seasons)} · ${formatRuntime(avgEp)}${t.title.perEpisode}`
          : t.title.seasons(detail.number_of_seasons);
      genres = detail.genres.map((g) => g.name);
      tagline = detail.tagline;
      studios = detail.networks.slice(0, 3).map((n) => n.name);
      director =
        credits.crew.find((c) => c.job === "Creator" || c.job === "Executive Producer")?.name ?? t.title.notAvailable;
      cast = credits.cast.slice(0, 6);
      similarTitles = similar.map((s) => ({
        id: s.id,
        name: s.name,
        genre: s.genre_ids[0] ? (GENRE_MAP[s.genre_ids[0]] ?? t.title.tv) : t.title.tv,
        year: s.first_air_date ? new Date(s.first_air_date).getFullYear() : 0,
        posterPath: s.poster_path,
        mediaType: "tv" as MediaType,
      }));
    }
  } catch {
    notFound();
  }

  // ── Reviews desde DB (JOIN ratings + users) ──
  const dbReviews = await db
    .select({
      score: ratings.score,
      review: ratings.review,
      updatedAt: ratings.updatedAt,
      userName: users.name,
      userImage: users.image,
    })
    .from(ratings)
    .innerJoin(users, eq(ratings.userId, users.id))
    .where(
      and(
        eq(ratings.tmdbId, Number(id)),
        eq(ratings.mediaType, type),
        isNotNull(ratings.review)
      )
    )
    .orderBy(desc(ratings.updatedAt))
    .limit(10);

  const score = Number(vote_average.toFixed(1));

  return (
    <div className="relative min-h-screen">
      {/* Fondo ambiental con backdrop real */}
      <div className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none overflow-hidden">
        {backdrop_path && (
          <Image
            src={backdropUrl(backdrop_path)}
            alt={title}
            fill
            priority
            className="object-cover object-center opacity-20 blur-sm scale-105"
            sizes="100vw"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/60 to-background" />
      </div>

      <div className="relative z-10 px-10 py-12 max-w-7xl mx-auto">

        {/* ─── Hero: Póster + Info ─── */}
        <section className="flex flex-col lg:flex-row gap-10 items-start mb-16">

          {/* Póster */}
          <div className="w-full lg:w-[280px] flex-shrink-0 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/10 blur-2xl opacity-40 rounded-2xl group-hover:opacity-60 transition-opacity duration-700" />
              <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-card group-hover:scale-[1.02] transition-transform duration-500">
                {poster_path ? (
                  <Image
                    src={posterUrl(poster_path)}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="280px"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-b from-slate-800 to-slate-950" />
                )}
                <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-xl" />
                <div className="absolute top-4 left-4 bg-background/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-border flex items-center gap-1.5">
                  <Star size={13} className="text-primary fill-primary" />
                  <span className="font-black text-primary text-sm">{score}</span>
                </div>
                {/* Badge de tipo */}
                <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {type === "movie" ? t.title.movie : t.title.tv}
                </div>
              </div>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 pt-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {genres.map((g) => (
                <span
                  key={g}
                  className="bg-secondary text-primary px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border border-border"
                >
                  {g}
                </span>
              ))}
            </div>

            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-foreground mb-6 leading-none">
              {title}
            </h1>

            {tagline && (
              <p className="text-muted-foreground italic mb-4 text-sm">
                &ldquo;{tagline}&rdquo;
              </p>
            )}

            <div className="flex flex-wrap items-center gap-8 mb-10">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-black text-primary leading-none">{score}</span>
                <div className="flex flex-col gap-0.5">
                  <div className="flex items-center gap-1">
                    <Star size={14} className="text-yellow-400 fill-yellow-400" />
                    <span className="text-sm font-bold text-foreground">/ 10</span>
                  </div>
                  <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold">
                    {t.title.tmdbAverage}
                  </span>
                </div>
              </div>

              <div className="h-10 w-px bg-border" />

              <div className="grid grid-cols-2 gap-x-8 gap-y-3">
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                     {type === "movie" ? t.title.director : t.title.creator}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{director}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                     {type === "movie" ? t.title.release : t.title.firstAired}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{releaseDate}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                     {type === "movie" ? t.title.runtime : t.title.length}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{runtime}</p>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                     {type === "movie" ? t.title.studio : t.title.network}
                  </p>
                  <p className="text-sm font-semibold text-foreground">{studios[0] ?? t.title.notAvailable}</p>
                </div>
              </div>
            </div>

            <AddToWatchlistButton
              tmdbId={Number(id)}
              mediaType={type}
              title={title}
              posterPath={poster_path ?? null}
            />
          </div>
        </section>

        {/* ─── Cuerpo: 8/4 cols ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">

          <div className="lg:col-span-8 space-y-14">
            <section>
              <div className="flex gap-8 border-b border-border mb-8">
                <button className="pb-4 text-sm font-bold uppercase tracking-widest text-primary border-b-2 border-primary">
                  {t.title.synopsisAndInfo}
                </button>
                <button className="pb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors">
                  {t.title.trailer}
                </button>
              </div>

              <div className="space-y-8">
                  <p className="text-base leading-relaxed text-muted-foreground">{overview || t.title.noOverview}</p>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-6 bg-card rounded-xl border border-border">
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                       {t.title.cast}
                     </h4>
                    <ul className="space-y-2">
                      {cast.map((c) => (
                        <li key={c.id} className="text-sm">
                          <span className="text-foreground font-medium">{c.name}</span>{" "}
                          <span className="text-muted-foreground italic">— {c.character}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-6 bg-card rounded-xl border border-border">
                    <h4 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                       {type === "movie" ? t.title.production : t.title.networks}
                     </h4>
                    {studios.map((s, i) => (
                      <p key={i} className="text-sm text-foreground mb-1">{s}</p>
                    ))}
                  </div>
                </div>
              </div>
            </section>

            {/* ─── Audience Voice ─── */}
            <section className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{t.title.audienceVoice}</h3>
                  {dbReviews.length > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {t.title.communityReviews(dbReviews.length)}
                    </p>
                  )}
                </div>
              </div>

              {dbReviews.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-14 text-center gap-3 bg-card rounded-2xl border border-border">
                  <p className="text-muted-foreground text-sm font-medium">{t.title.noReviews}</p>
                  <p className="text-xs text-muted-foreground/50">
                    {t.title.noReviewsHint}
                  </p>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  {dbReviews.map((r, i) => (
                    <ReviewCard
                      key={i}
                      userName={r.userName ?? t.title.anonymous}
                      userImage={r.userImage ?? null}
                      score={r.score}
                      review={r.review!}
                      updatedAt={r.updatedAt}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-8">
              <RatingPanel tmdbId={Number(id)} mediaType={type} />
              <SimilarTitles titles={similarTitles} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
