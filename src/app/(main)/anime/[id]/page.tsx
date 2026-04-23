import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Star } from "lucide-react";
import { formatAniListDescription, getAnimeDetail } from "@/lib/anilist";
import { AddToWatchlistButton } from "@/components/title/add-to-watchlist-button";
import { RatingPanel } from "@/components/title/rating-panel";
import { ReviewCard } from "@/components/title/review-card";
import { db } from "@/lib/db";
import { t } from "@/lib/i18n";
import { getLocalizedAnimeOverview } from "@/lib/tmdb";
import { ratings, users, reviewReactions } from "@/lib/schema";
import { and, desc, eq, inArray, isNotNull } from "drizzle-orm";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

function formatDate(year: number | null, month: number | null, day: number | null): string {
  if (!year) return t.category.notAvailable;
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animeId = Number(id);

  if (!Number.isInteger(animeId) || animeId <= 0) {
    notFound();
  }

  const detail = await getAnimeDetail(animeId);

  if (!detail) {
    notFound();
  }

  const title = detail.title.english ?? detail.title.romaji ?? detail.title.native ?? t.category.notAvailable;
  const score = detail.averageScore ? (detail.averageScore / 10).toFixed(1) : "--";
  const studios = detail.studios.nodes.map((node) => node.name).slice(0, 3);
  const characters = detail.characters.edges.filter((edge) => edge.node.name.full).slice(0, 6);
  const staff = detail.staff.edges.filter((edge) => edge.node.name.full).slice(0, 6);
  const recommendations = detail.recommendations.nodes
    .map((node) => node.mediaRecommendation)
    .filter((item): item is NonNullable<typeof item> => Boolean(item))
    .slice(0, 6);
  const localizedOverview = await getLocalizedAnimeOverview(
    [detail.title.english, detail.title.romaji, detail.title.native],
    detail.seasonYear
  );
  const overview = localizedOverview ?? formatAniListDescription(detail.description) ?? t.anime.noDescription;

  const [dbReviews, session] = await Promise.all([
    db
      .select({
        id: ratings.id,
        score: ratings.score,
        review: ratings.review,
        updatedAt: ratings.updatedAt,
        userName: users.name,
        userImage: users.image,
        userHandle: users.username,
      })
      .from(ratings)
      .innerJoin(users, eq(ratings.userId, users.id))
      .where(
        and(
          eq(ratings.tmdbId, animeId),
          eq(ratings.source, "anilist"),
          eq(ratings.mediaType, "anime"),
          isNotNull(ratings.review)
        )
      )
      .orderBy(desc(ratings.updatedAt))
      .limit(10),
    auth(),
  ]);

  // ── Reaction data for reviews ──
  type ReactionType = "like" | "love" | "surprise" | "angry";
  const reviewRatingIds = dbReviews.map((r) => r.id);
  const summaryByRatingId: Record<string, Record<string, number>> = {};
  const userReactionByRatingId: Record<string, ReactionType> = {};

  if (reviewRatingIds.length > 0) {
    const reactionRows = await db
      .select({
        ratingId: reviewReactions.ratingId,
        reactionType: reviewReactions.reactionType,
        reactorUserId: reviewReactions.userId,
      })
      .from(reviewReactions)
      .where(inArray(reviewReactions.ratingId, reviewRatingIds));

    for (const row of reactionRows) {
      if (!summaryByRatingId[row.ratingId]) {
        summaryByRatingId[row.ratingId] = {};
      }
      summaryByRatingId[row.ratingId][row.reactionType] =
        (summaryByRatingId[row.ratingId][row.reactionType] ?? 0) + 1;

      if (session?.user?.id && row.reactorUserId === session.user.id) {
        userReactionByRatingId[row.ratingId] = row.reactionType as ReactionType;
      }
    }
  }

  return (
    <div className="relative min-h-screen">
      <div className="absolute top-0 left-0 right-0 h-[500px] pointer-events-none overflow-hidden">
        {detail.bannerImage && (
          <Image
            src={detail.bannerImage}
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
        <Link href="/categories/anime" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8">
          <ChevronLeft size={14} />
          {t.category.animeTitle}
        </Link>

        <section className="flex flex-col lg:flex-row gap-10 items-start mb-16">
          <div className="w-full lg:w-[280px] flex-shrink-0 group">
            <div className="relative">
              <div className="absolute -inset-2 bg-primary/10 blur-2xl opacity-40 rounded-2xl group-hover:opacity-60 transition-opacity duration-700" />
              <div className="relative w-full aspect-[2/3] rounded-xl overflow-hidden border border-white/10 shadow-2xl bg-card group-hover:scale-[1.02] transition-transform duration-500">
                {detail.coverImage.extraLarge || detail.coverImage.large || detail.coverImage.medium ? (
                  <Image
                    src={detail.coverImage.extraLarge ?? detail.coverImage.large ?? detail.coverImage.medium ?? ""}
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
                <div className="absolute top-4 right-4 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
                  {t.anime.title}
                </div>
              </div>
            </div>
          </div>

          <div className="flex-1 pt-2">
            <div className="flex flex-wrap gap-2 mb-4">
              {detail.genres.map((genre) => (
                <span
                  key={genre}
                  className="bg-secondary text-primary px-3 py-1 rounded-md text-[10px] font-bold tracking-widest uppercase border border-border"
                >
                  {genre}
                </span>
              ))}
            </div>

            <h1 className="text-6xl lg:text-7xl font-black tracking-tighter text-foreground mb-3 leading-none">
              {title}
            </h1>

            <p className="text-xs uppercase tracking-[0.3em] text-primary/80 font-bold mb-6">
              {t.anime.source}
            </p>

            <p className="text-muted-foreground text-base leading-relaxed mb-10 max-w-3xl">
              {overview}
            </p>

            <div className="grid grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4 mb-10">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.year}
                </p>
                <p className="text-sm font-semibold text-foreground">
                  {formatDate(detail.startDate.year, detail.startDate.month, detail.startDate.day)}
                </p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.episodes}
                </p>
                <p className="text-sm font-semibold text-foreground">{detail.episodes ?? t.category.notAvailable}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.duration}
                </p>
                <p className="text-sm font-semibold text-foreground">{detail.duration ? `${detail.duration} min` : t.category.notAvailable}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.format}
                </p>
                <p className="text-sm font-semibold text-foreground">{detail.format ?? t.category.notAvailable}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.studio}
                </p>
                <p className="text-sm font-semibold text-foreground">{studios[0] ?? t.category.notAvailable}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-0.5">
                  {t.anime.status}
                </p>
                <p className="text-sm font-semibold text-foreground">{detail.status ?? t.category.notAvailable}</p>
              </div>
            </div>

            <div className="mt-8">
              <AddToWatchlistButton
                tmdbId={animeId}
                source="anilist"
                mediaType="anime"
                title={title}
                posterPath={detail.coverImage.large ?? detail.coverImage.medium ?? detail.coverImage.extraLarge ?? null}
              />
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          <div className="lg:col-span-8 space-y-14">
            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                  {t.anime.characters}
                </h3>
                <ul className="space-y-3">
                  {characters.map((character) => (
                    <li key={character.node.id} className="text-sm">
                      <span className="text-foreground font-medium">{character.node.name.full}</span>{" "}
                      <span className="text-muted-foreground italic">— {character.role ?? t.category.notAvailable}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="p-6 bg-card rounded-xl border border-border">
                <h3 className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-4">
                  {t.anime.staff}
                </h3>
                <ul className="space-y-3">
                  {staff.map((person) => (
                    <li key={person.node.id} className="text-sm">
                      <span className="text-foreground font-medium">{person.node.name.full}</span>{" "}
                      <span className="text-muted-foreground italic">— {person.role ?? t.category.notAvailable}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>

            <section className="space-y-6">
              <div className="flex items-end justify-between">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">{t.anime.audienceVoice}</h3>
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
                  {dbReviews.map((review) => (
                    <ReviewCard
                      key={review.id}
                      userName={review.userName ?? t.title.anonymous}
                      userImage={review.userImage ?? null}
                      userHandle={review.userHandle ?? null}
                      score={review.score}
                      review={review.review!}
                      updatedAt={review.updatedAt}
                      ratingId={review.id}
                      reactionSummary={summaryByRatingId[review.id] ?? {}}
                      userReaction={userReactionByRatingId[review.id] ?? null}
                      isGuest={!session?.user?.id}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>

          <div className="lg:col-span-4">
            <div className="sticky top-20 space-y-8">
              <RatingPanel tmdbId={animeId} mediaType="anime" source="anilist" title={title} posterPath={detail.coverImage.large ?? detail.coverImage.medium ?? null} />
              <h3 className="text-[11px] uppercase tracking-widest text-muted-foreground font-bold">
                {t.anime.recommendations}
              </h3>

              <div className="flex flex-col gap-3">
                {recommendations.map((item) => {
                  const recommendationTitle = item.title.english ?? item.title.romaji ?? item.title.native ?? t.category.notAvailable;

                  return (
                    <Link
                      key={item.id}
                      href={`/anime/${item.id}`}
                      className="flex items-center gap-4 group"
                    >
                      <div className="w-16 h-20 rounded-lg flex-shrink-0 overflow-hidden border border-border bg-card relative">
                        {item.coverImage.large || item.coverImage.medium ? (
                          <Image
                            src={item.coverImage.large ?? item.coverImage.medium ?? ""}
                            alt={recommendationTitle}
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
                          {recommendationTitle}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.genres.slice(0, 2).join(" • ") || t.category.notAvailable}
                          {item.seasonYear ? ` • ${item.seasonYear}` : ""}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
