import Image from "next/image";
import { redirect } from "next/navigation";
import {
  Star,
  MessageSquare,
  Eye,
  Share2,
  BadgeCheck,
  History,
  UserCircle2,
} from "lucide-react";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ratings, watchlist, users } from "@/lib/schema";
import { eq, and, isNotNull, count, desc } from "drizzle-orm";
import { getMovieDetail, getTVDetail, posterUrl } from "@/lib/tmdb";
import { RatedCard } from "@/components/profile/rated-card";
import { ProfileTabs } from "@/components/profile/profile-tabs";
import { WatchlistItemCard } from "@/components/watchlist/watchlist-item-card";
import { ReviewListCard } from "@/components/profile/review-list-card";
import { t } from "@/lib/i18n";

export const dynamic = "force-dynamic";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatJoinDate(date: Date): string {
  return date.toLocaleDateString("es-MX", { month: "long", year: "numeric" });
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/profile");

  const userId = session.user.id;

  // ── Parallel DB queries ──
  const [
    [userRecord],
    [{ ratingsCount }],
    [{ reviewsCount }],
    [{ watchlistCount }],
    recentRatings,
    watchlistItems,
    reviewsRaw,
  ] = await Promise.all([
    db.select().from(users).where(eq(users.id, userId)).limit(1),
    db
      .select({ ratingsCount: count() })
      .from(ratings)
      .where(eq(ratings.userId, userId)),
    db
      .select({ reviewsCount: count() })
      .from(ratings)
      .where(and(eq(ratings.userId, userId), isNotNull(ratings.review))),
    db
      .select({ watchlistCount: count() })
      .from(watchlist)
      .where(eq(watchlist.userId, userId)),
    db
      .select()
      .from(ratings)
      .where(eq(ratings.userId, userId))
      .orderBy(desc(ratings.updatedAt))
      .limit(20),
    db
      .select()
      .from(watchlist)
      .where(eq(watchlist.userId, userId))
      .orderBy(desc(watchlist.addedAt)),
    db
      .select()
      .from(ratings)
      .where(and(eq(ratings.userId, userId), isNotNull(ratings.review)))
      .orderBy(desc(ratings.updatedAt)),
  ]);

  // ── Fetch TMDB data for each rated title ──
  type EnrichedRating = {
    tmdbId: number;
    mediaType: "movie" | "tv";
    score: number;
    review: string | null;
    updatedAt: Date;
    title: string;
    posterPath: string | null;
    genre: string;
    year: number | null;
  };

  const enriched: EnrichedRating[] = (
    await Promise.allSettled(
      recentRatings.map(async (r) => {
        if (r.mediaType === "movie") {
          const detail = await getMovieDetail(r.tmdbId);
          return {
            tmdbId: r.tmdbId,
            mediaType: "movie" as const,
            score: r.score,
            review: r.review,
            updatedAt: r.updatedAt,
            title: detail.title,
            posterPath: detail.poster_path,
            genre: detail.genres[0]?.name ?? "—",
            year: detail.release_date
              ? new Date(detail.release_date).getFullYear()
              : null,
          };
        } else {
          const detail = await getTVDetail(r.tmdbId);
          return {
            tmdbId: r.tmdbId,
            mediaType: "tv" as const,
            score: r.score,
            review: r.review,
            updatedAt: r.updatedAt,
            title: detail.name,
            posterPath: detail.poster_path,
            genre: detail.genres[0]?.name ?? "—",
            year: detail.first_air_date
              ? new Date(detail.first_air_date).getFullYear()
              : null,
          };
        }
      })
    )
  )
    .filter(
      (r): r is PromiseFulfilledResult<EnrichedRating> => r.status === "fulfilled"
    )
    .map((r) => r.value);

  // ── Derived data ──
  const userName = userRecord?.name ?? session.user.name ?? "User";
  const userImage = userRecord?.image ?? session.user.image ?? null;
  const userEmail = userRecord?.email ?? session.user.email ?? "";
  const emailHandle = userEmail.split("@")[0];
  const joinDate = userRecord?.createdAt
    ? formatJoinDate(userRecord.createdAt)
    : null;

  const activityItems = enriched.slice(0, 5);

  // ── Ratings grid (for ProfileTabs) ──
  const ratingsGrid = (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
      {      enriched.length === 0 ? (
        <div className="col-span-full flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noRatings}</p>
          <p className="text-xs text-muted-foreground/50">
            {t.profile.noRatingsHint}
          </p>
        </div>
      ) : (
        enriched.map((item) => (
          <RatedCard
            key={`${item.mediaType}-${item.tmdbId}`}
            tmdbId={item.tmdbId}
            mediaType={item.mediaType}
            title={item.title}
            genre={item.genre}
            year={item.year}
            score={item.score}
            posterPath={item.posterPath}
            userName={userName}
          />
        ))
      )}
    </div>
  );

  // ── Watchlist grid (for ProfileTabs) ──
  const watchlistGrid = (
    <div>
      {watchlistItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noWatchlist}</p>
          <p className="text-xs text-muted-foreground/50">
            {t.profile.noWatchlistHint}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-5">
          {watchlistItems.map((item) => (
            <WatchlistItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );

  // ── Enrich reviews with TMDB data ──
  type EnrichedReview = {
    tmdbId: number;
    mediaType: "movie" | "tv";
    score: number;
    review: string;
    updatedAt: Date;
    title: string;
    posterPath: string | null;
    genre: string;
    year: number | null;
  };

  const enrichedReviews: EnrichedReview[] = (
    await Promise.allSettled(
      reviewsRaw.map(async (r) => {
        if (r.mediaType === "movie") {
          const detail = await getMovieDetail(r.tmdbId);
          return {
            tmdbId: r.tmdbId,
            mediaType: "movie" as const,
            score: r.score,
            review: r.review!,
            updatedAt: r.updatedAt,
            title: detail.title,
            posterPath: detail.poster_path,
            genre: detail.genres[0]?.name ?? "—",
            year: detail.release_date ? new Date(detail.release_date).getFullYear() : null,
          };
        } else {
          const detail = await getTVDetail(r.tmdbId);
          return {
            tmdbId: r.tmdbId,
            mediaType: "tv" as const,
            score: r.score,
            review: r.review!,
            updatedAt: r.updatedAt,
            title: detail.name,
            posterPath: detail.poster_path,
            genre: detail.genres[0]?.name ?? "—",
            year: detail.first_air_date ? new Date(detail.first_air_date).getFullYear() : null,
          };
        }
      })
    )
  )
    .filter((r): r is PromiseFulfilledResult<EnrichedReview> => r.status === "fulfilled")
    .map((r) => r.value);

  // ── Reviews list (for ProfileTabs) ──
  const reviewsContent = (
    <div className="space-y-3">
      {enrichedReviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center gap-3">
          <p className="text-muted-foreground text-sm">{t.profile.noReviews}</p>
          <p className="text-xs text-muted-foreground/50">
            {t.profile.noReviewsHint}
          </p>
        </div>
      ) : (
        enrichedReviews.map((item) => (
          <ReviewListCard
            key={`${item.mediaType}-${item.tmdbId}`}
            tmdbId={item.tmdbId}
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

  // ── STATS ──
  const STATS = [
    { icon: Star, value: String(ratingsCount), label: t.profile.stats.ratings },
    { icon: MessageSquare, value: String(reviewsCount), label: t.profile.stats.reviews },
    { icon: Eye, value: String(watchlistCount), label: t.profile.stats.watchlist },
  ];

  return (
    <>
      {/* ─── Profile Hero ─── */}
      <section className="pb-8 px-8">
        <div className="relative rounded-3xl overflow-hidden bg-[#181c22] p-8 mt-6">
          {/* Glow */}
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-[#00e5ff]/5 blur-[120px] rounded-full pointer-events-none" />

          <div className="relative flex flex-col md:flex-row items-end gap-8">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-3xl overflow-hidden border-2 border-[#00e5ff]/20 shadow-2xl bg-[#262a31] flex items-center justify-center">
                {userImage ? (
                  <Image
                    src={userImage}
                    alt={userName}
                    fill
                    className="object-cover"
                    sizes="160px"
                  />
                ) : (
                  <UserCircle2 size={72} className="text-[#849396]" />
                )}
              </div>
              {/* Rating tier badge */}
              {ratingsCount >= 10 && (
                <div className="absolute -bottom-3 -right-3 bg-[#00e5ff] text-[#001f24] font-black px-3 py-1 rounded-lg text-sm shadow-xl">
                  {ratingsCount >= 100 ? "S" : ratingsCount >= 50 ? "A" : "B"}+
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 space-y-4 min-w-0">
              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-4xl font-black tracking-tighter text-[#dfe2eb] truncate">
                    {userName}
                  </h2>
                  <BadgeCheck size={22} className="text-[#00e5ff] flex-shrink-0" />
                </div>
                <p className="text-[#849396] font-medium text-sm">
                  @{emailHandle}
                  {joinDate && ` • ${t.profile.joinedSince} ${joinDate}`}
                </p>
              </div>

              {/* Stats */}
              <div className="flex flex-wrap gap-8 pt-2">
                {STATS.map(({ icon: Icon, value, label }) => (
                  <div key={label} className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-[#262a31] flex items-center justify-center text-[#00e5ff]">
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                    <div>
                      <p className="text-xl font-bold leading-none text-[#dfe2eb]">
                        {value}
                      </p>
                      <p className="text-[0.6875rem] uppercase tracking-widest text-[#849396]">
                        {label}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 flex-shrink-0">
              <button className="px-6 py-2.5 bg-gradient-to-br from-[#c3f5ff] to-[#00e5ff] text-[#001f24] font-bold rounded-xl text-sm active:scale-95 shadow-lg shadow-[#00e5ff]/20 transition-transform">
                {t.profile.editProfile}
              </button>
              <button className="px-3 py-2.5 bg-[#262a31] text-[#dfe2eb] rounded-xl hover:bg-[#31353c] transition-colors">
                <Share2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Sticky Tab Bar + content ─── */}
      <section className="px-8 sticky top-14 z-30 bg-[#10141a]/90 backdrop-blur-md">
        <ProfileTabs ratingsContent={ratingsGrid} watchlistContent={watchlistGrid} reviewsContent={reviewsContent} />
      </section>

      {/* ─── About & Activity ─── */}
      <section className="p-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* About */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <UserCircle2 size={20} className="text-[#00e5ff]" />
            <h3 className="text-lg font-bold">{t.profile.about}</h3>
          </div>
          <div className="bg-[#1c2026] p-6 rounded-2xl border border-white/5 space-y-4">
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#849396] font-bold">
                  {t.profile.email}
                </p>
              <p className="text-sm text-[#dfe2eb]">{userEmail}</p>
            </div>
            {joinDate && (
              <div className="space-y-1">
                <p className="text-[10px] uppercase tracking-widest text-[#849396] font-bold">
                  {t.profile.joinedSince}
                </p>
                <p className="text-sm text-[#dfe2eb]">{joinDate}</p>
              </div>
            )}
            <div className="space-y-1">
              <p className="text-[10px] uppercase tracking-widest text-[#849396] font-bold">
                  {t.profile.activity}
                </p>
                <p className="text-sm text-[#dfe2eb]">
                  {t.profile.activitySummary(String(ratingsCount), String(reviewsCount))}
                </p>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <History size={20} className="text-[#00e5ff]" />
            <h3 className="text-lg font-bold">{t.profile.recentActivity}</h3>
          </div>

          {activityItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center gap-3 bg-[#181c22] rounded-2xl border border-white/5">
              <p className="text-muted-foreground text-sm">{t.profile.noActivity}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityItems.map((item) => {
                const imgSrc = item.posterPath
                  ? posterUrl(item.posterPath, "w92")
                  : null;
                const scoreColor =
                  item.score >= 8
                    ? "text-emerald-400"
                    : item.score >= 6
                      ? "text-yellow-400"
                      : "text-rose-400";

                return (
                  <div
                    key={`${item.mediaType}-${item.tmdbId}`}
                    className="flex gap-4 p-4 rounded-2xl bg-[#181c22] hover:bg-[#1c2026] transition-colors border border-white/[0.03]"
                  >
                    {/* Thumbnail */}
                    <div className="w-12 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-[#262a31] relative">
                      {imgSrc ? (
                        <Image
                          src={imgSrc}
                          alt={item.title}
                          fill
                          className="object-cover"
                          sizes="48px"
                        />
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm">
                        <span className="font-bold text-[#dfe2eb]">{userName} </span>
                        <span className="text-[#849396]">{t.profile.rated} </span>
                        <span className="font-bold text-[#00e5ff]">
                          {item.title}
                        </span>
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-sm font-black ${scoreColor}`}>
                          {item.score}/10
                        </span>
                        {item.review && (
                          <span className="text-[10px] text-[#849396] uppercase tracking-wider">
                            {t.profile.withReview}
                          </span>
                        )}
                      </div>
                      <span className="text-[0.65rem] text-[#849396] uppercase tracking-tighter mt-1 block">
                        {timeAgo(item.updatedAt)}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
