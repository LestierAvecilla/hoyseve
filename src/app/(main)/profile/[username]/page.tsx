import { notFound, permanentRedirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ratings, watchlist, users, follows } from "@/lib/schema";
import { eq, and, count, desc, isNotNull, sql } from "drizzle-orm";
import { getAnimeDetail } from "@/lib/anilist";
import { getMovieDetail, getTVDetail } from "@/lib/tmdb";
import { RatedCard } from "@/components/profile/rated-card";
import { WatchlistItemCard } from "@/components/watchlist/watchlist-item-card";
import { ReviewListCard } from "@/components/profile/review-list-card";
import { HallOfFame } from "@/components/profile/hall-of-fame";
import { MetricsSection } from "@/components/profile/metrics-section";
import { PublicProfileClient } from "@/components/profile/public-profile-client";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type EnrichedRating = {
  source: "tmdb" | "anilist";
  tmdbId: number;
  mediaType: "movie" | "tv" | "anime";
  score: number;
  review: string | null;
  updatedAt: Date;
  title: string;
  posterPath: string | null;
  genre: string;
  year: number | null;
};

type EnrichedReview = {
  source: "tmdb" | "anilist";
  tmdbId: number;
  mediaType: "movie" | "tv" | "anime";
  score: number;
  review: string;
  updatedAt: Date;
  title: string;
  posterPath: string | null;
  genre: string;
  year: number | null;
};

function timeAgo(date: Date): string {
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60_000);
  const hrs = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (mins < 60) return `${mins}${t.profile.timeAgo.minutesSuffix}`;
  if (hrs < 24) return `${hrs}${t.profile.timeAgo.hoursSuffix}`;
  if (days === 1) return t.profile.timeAgo.yesterday;
  if (days < 30) return `${days} ${t.profile.timeAgo.daysSuffix}`;
  return `${Math.floor(days / 30)} ${t.profile.timeAgo.monthsSuffix}`;
}

async function enrichRating(r: typeof ratings.$inferSelect): Promise<EnrichedRating> {
  if (r.source === "anilist" || r.mediaType === "anime") {
    const detail = await getAnimeDetail(r.tmdbId);
    return {
      source: "anilist" as const,
      tmdbId: r.tmdbId,
      mediaType: "anime" as const,
      score: r.score,
      review: r.review,
      updatedAt: r.updatedAt,
      title: detail?.title.english ?? detail?.title.romaji ?? detail?.title.native ?? "—",
      posterPath: detail?.coverImage.large ?? detail?.coverImage.medium ?? detail?.coverImage.extraLarge ?? null,
      genre: detail?.genres[0] ?? "—",
      year: detail?.seasonYear ?? null,
    };
  }

  if (r.mediaType === "movie") {
    const detail = await getMovieDetail(r.tmdbId);
    return {
      source: "tmdb" as const,
      tmdbId: r.tmdbId,
      mediaType: "movie" as const,
      score: r.score,
      review: r.review,
      updatedAt: r.updatedAt,
      title: detail.title,
      posterPath: detail.poster_path,
      genre: detail.genres[0]?.name ?? "—",
      year: detail.release_date ? new Date(detail.release_date).getFullYear() : null,
    };
  }

  const detail = await getTVDetail(r.tmdbId);
  return {
    source: "tmdb" as const,
    tmdbId: r.tmdbId,
    mediaType: "tv" as const,
    score: r.score,
    review: r.review,
    updatedAt: r.updatedAt,
    title: detail.name,
    posterPath: detail.poster_path,
    genre: detail.genres[0]?.name ?? "—",
    year: detail.first_air_date ? new Date(detail.first_air_date).getFullYear() : null,
  };
}

export default async function PublicProfilePage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const session = await auth();
  const currentUserId = session?.user?.id ?? null;

  // 301 redirect to lowercase canonical URL
  const normalized = username.toLowerCase();
  if (username !== normalized) {
    permanentRedirect(`/profile/${normalized}`);
  }

  // Find user by username (direct lookup, case-insensitive)
  const [userRecord] = await db
    .select()
    .from(users)
    .where(sql`LOWER(${users.username}) = LOWER(${normalized})`)
    .limit(1);

  // 404 if not found or user has no username
  if (!userRecord || !userRecord.username) {
    notFound();
  }

  const isOwnProfile = currentUserId === userRecord.id;

  // ── Parallel DB queries ──
  const [
    userRatings,
    userWatchlist,
    userReviewsRaw,
    followersCountResult,
    followingCountResult,
    currentUserFollowsTarget,
  ] = await Promise.all([
    db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userRecord.id))
      .orderBy(desc(ratings.updatedAt)),
    db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userRecord.id))
      .orderBy(desc(watchlist.addedAt)),
    db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userRecord.id), isNotNull(ratings.review)))
      .orderBy(desc(ratings.updatedAt)),
    db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followingId, userRecord.id)),
    db
      .select({ count: count() })
      .from(follows)
      .where(eq(follows.followerId, userRecord.id)),
    currentUserId
      ? db
          .select()
          .from(follows)
          .where(
            and(
              eq(follows.followerId, currentUserId),
              eq(follows.followingId, userRecord.id)
            )
          )
          .limit(1)
      : Promise.resolve([]),
  ]);

  const followersCount = followersCountResult[0]?.count ?? 0;
  const followingCount = followingCountResult[0]?.count ?? 0;
  const initialIsFollowing = currentUserFollowsTarget.length > 0;

  // ── Enrich ratings ──
  const enrichedRatings: EnrichedRating[] = (
    await Promise.allSettled(userRatings.map(enrichRating))
  )
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  // ── Hall of Fame (top 4 by score) ──
  const hallOfFameItems = [...enrichedRatings]
    .sort((a, b) => b.score - a.score)
    .slice(0, 4)
    .map((r) => ({
      tmdbId: r.tmdbId,
      source: r.source,
      mediaType: r.mediaType,
      title: r.title,
      posterPath: r.posterPath,
      score: r.score,
    }));

  // ── Metrics ──
  const totalWatched = enrichedRatings.length;
  const avgRating =
    enrichedRatings.length > 0
      ? enrichedRatings.reduce((sum, r) => sum + r.score, 0) / enrichedRatings.length
      : null;

  // Top genre - most frequent genre from enriched ratings
  const genreCounts: Record<string, number> = {};
  for (const r of enrichedRatings) {
    if (r.genre && r.genre !== "—") {
      genreCounts[r.genre] = (genreCounts[r.genre] ?? 0) + 1;
    }
  }
  const topGenre =
    Object.entries(genreCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;

  // ── Enrich reviews ──
  const enrichedReviews: EnrichedReview[] = (
    await Promise.allSettled(userReviewsRaw.map(async (r) => {
      const enriched = await enrichRating(r);
      return {
        ...enriched,
        review: r.review!,
      };
    }))
  )
    .filter((r) => r.status === "fulfilled")
    .map((r) => r.value);

  // ── Ratings grid ──
  const ratingsGrid = (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {enrichedRatings.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noRatings}</p>
        </div>
      ) : (
        enrichedRatings.map((item) => (
          <RatedCard
            key={`${item.mediaType}-${item.tmdbId}`}
            tmdbId={item.tmdbId}
            source={item.source}
            mediaType={item.mediaType}
            title={item.title}
            genre={item.genre}
            year={item.year}
            score={item.score}
            posterPath={item.posterPath}
            userName={userRecord.name ?? username}
          />
        ))
      )}
    </div>
  );

  // ── Watchlist grid ──
  const watchlistGrid = (
    <div>
      {userWatchlist.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noWatchlist}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {userWatchlist.map((item) => (
            <WatchlistItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  // ── Reviews list ──
  const reviewsContent = (
    <div className="space-y-3">
      {enrichedReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noReviews}</p>
        </div>
      ) : (
        enrichedReviews.map((item) => (
          <ReviewListCard
            key={`${item.mediaType}-${item.tmdbId}`}
            tmdbId={item.tmdbId}
            source={item.source}
            mediaType={item.mediaType}
            title={item.title}
            posterPath={item.posterPath}
            genre={item.genre}
            year={item.year}
            score={item.score}
            review={item.review}
            updatedAt={item.updatedAt}
          />
        ))
      )}
    </div>
  );

  return (
    <>
      {/* Hall of Fame + Metrics passed as props so PublicProfileClient controls render order:
          ProfileHeader → HallOfFame → Metrics → Sticky Tabs */}
      <PublicProfileClient
        ratingsContent={ratingsGrid}
        watchlistContent={watchlistGrid}
        reviewsContent={reviewsContent}
        username={userRecord.name ?? username}
        userId={userRecord.id}
        currentUserId={currentUserId}
        initialFollowersCount={followersCount}
        initialFollowingCount={followingCount}
        name={userRecord.name}
        email={userRecord.email}
        userHandle={userRecord.username ?? null}
        image={userRecord.image}
        isOwnProfile={isOwnProfile}
        initialIsFollowing={initialIsFollowing}
        createdAt={userRecord.createdAt}
        hallOfFameContent={<HallOfFame items={hallOfFameItems} />}
        metricsContent={
          <MetricsSection
            totalWatched={totalWatched}
            avgRating={avgRating}
            topGenre={topGenre}
          />
        }
      />
    </>
  );
}
