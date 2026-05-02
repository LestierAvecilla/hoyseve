import Image from "next/image";
import Link from "next/link";
import { Star, MessageSquare, Plus } from "lucide-react";
import { posterUrl } from "@/lib/tmdb";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { UserLink } from "@/components/shared/user-link";
import { ReactionBar } from "@/components/shared/reaction-bar";

type ReactionType = "hype" | "sadness" | "plot_twist" | "skip";
type ReactionSummary = Partial<Record<ReactionType, number>>;

const REACTION_EMOJI: Record<ReactionType, string> = {
  hype: "🔥",
  sadness: "😭",
  plot_twist: "😱",
  skip: "💤",
};

function ReactionSummaryBadges({ summary }: { summary: ReactionSummary }) {
  const sorted = (Object.entries(summary) as [ReactionType, number][])
    .filter(([, count]) => count > 0)
    .sort(([, a], [, b]) => b - a);

  if (sorted.length === 0) return null;

  const top2 = sorted.slice(0, 2);
  const rest = sorted.length - 2;

  return (
    <div className="flex items-center gap-1">
      {top2.map(([type, count]) => (
        <span
          key={type}
          className="flex items-center gap-0.5 text-xs text-[#849396] bg-white/[0.04] px-1.5 py-0.5 rounded-md border border-white/[0.06]"
        >
          <span>{REACTION_EMOJI[type]}</span>
          <span className="font-semibold tabular-nums">{count}</span>
        </span>
      ))}
      {rest > 0 && (
        <span className="text-[0.65rem] text-[#849396]">+{rest} más</span>
      )}
    </div>
  );
}

type Activity = {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string | null;
  userHandle: string | null;
  type: "rating" | "review" | "watchlist_add";
  tmdbId: number;
  mediaType: "movie" | "tv" | "anime";
  source: "tmdb" | "anilist";
  score: number | null;
  review: string | null;
  title: string;
  posterPath: string | null;
  createdAt: string;
  ratingId?: string | null;
  reactionSummary?: ReactionSummary;
  userReaction?: ReactionType | null;
  isGuest?: boolean;
};

const typeConfig = {
  rating: {
    Icon: Star,
    label: "valoró",
    badgeColor: "text-yellow-400",
  },
  review: {
    Icon: MessageSquare,
    label: "reseñó",
    badgeColor: "text-[#00e5ff]",
  },
  watchlist_add: {
    Icon: Plus,
    label: "agregó a su lista",
    badgeColor: "text-emerald-400",
  },
} as const;

export function ActivityCard({ activity }: { activity: Activity }) {
  const config = typeConfig[activity.type];
  const { Icon } = config;

  const href =
    activity.mediaType === "movie"
      ? `/title/movie/${activity.tmdbId}`
      : activity.mediaType === "anime"
        ? `/anime/${activity.tmdbId}`
        : `/title/tv/${activity.tmdbId}`;

  const imgSrc = activity.posterPath
    ? activity.source === "tmdb"
      ? posterUrl(activity.posterPath, "w92")
      : activity.posterPath
    : null;

  const scoreColor =
    activity.score !== null
      ? activity.score >= 8
        ? "text-emerald-400"
        : activity.score >= 6
          ? "text-yellow-400"
          : "text-rose-400"
      : "";

  const timeAgo = formatDistanceToNow(new Date(activity.createdAt), {
    addSuffix: true,
    locale: es,
  });

  const showReactions =
    (activity.type === "review" || activity.type === "rating") &&
    activity.ratingId;

  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-[#181c22] hover:bg-[#1c2026] transition-colors border border-white/[0.03]">
      {/* Poster */}
      <Link href={href} className="flex-shrink-0">
        <div className="w-12 h-16 rounded-lg overflow-hidden bg-[#262a31] relative">
          {imgSrc ? (
            <Image
              src={imgSrc}
              alt={activity.title}
              fill
              className="object-cover"
              sizes="48px"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-b from-slate-700 to-slate-900" />
          )}
        </div>
      </Link>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {/* User row */}
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <UserLink
            userId={activity.userId}
            userName={activity.userName}
            userAvatar={activity.userAvatar}
            userHandle={activity.userHandle}
          />
          <span className={`flex items-center gap-1 text-xs ${config.badgeColor}`}>
            <Icon size={12} />
            {config.label}
          </span>
        </div>

        {/* Title */}
        <Link href={href}>
          <h3 className="font-bold text-[#dfe2eb] hover:text-[#00e5ff] transition-colors text-sm truncate">
            {activity.title}
          </h3>
        </Link>

        {/* Score + snippet */}
        <div className="flex items-center gap-3 mt-1">
          {activity.score !== null && (
            <span
              className={`flex items-center gap-1 text-sm font-black ${scoreColor}`}
            >
              {activity.score}/10
            </span>
          )}
          {activity.type === "review" && activity.review && (
            <p className="text-xs text-[#849396] line-clamp-1 italic">
              &ldquo;{activity.review}&rdquo;
            </p>
          )}
        </div>

        {/* Timestamp */}
        <span className="text-[0.65rem] text-[#849396] uppercase tracking-tighter mt-1 block">
          {timeAgo}
        </span>

        {/* Reactions */}
        {showReactions && (
          <div className="mt-2">
            {activity.isGuest ? (
              <ReactionSummaryBadges summary={activity.reactionSummary ?? {}} />
            ) : (
              <ReactionBar
                targetId={activity.ratingId!}
                apiPath="/api/reactions"
                summary={activity.reactionSummary ?? {}}
                userReaction={activity.userReaction ?? null}
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
