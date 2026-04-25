import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";
import { UserLink } from "@/components/shared/user-link";
import { ReactionBar } from "@/components/shared/reaction-bar";

type ReactionType = "hype" | "sadness" | "plot_twist" | "skip";

const REACTION_EMOJI: Record<ReactionType, string> = {
  hype: "🔥",
  sadness: "😭",
  plot_twist: "😱",
  skip: "💤",
};

interface ReviewCardProps {
  userName: string;
  userImage: string | null;
  userHandle?: string | null;
  score: number;
  review: string;
  updatedAt?: Date;
  ratingId?: string;
  reactionSummary?: Partial<Record<ReactionType, number>>;
  userReaction?: ReactionType | null;
  isGuest?: boolean;
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

function ReactionSummaryBadges({ summary }: { summary: Partial<Record<ReactionType, number>> }) {
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

export function ReviewCard({
  userName,
  userImage,
  userHandle,
  score,
  review,
  updatedAt,
  ratingId,
  reactionSummary = {},
  userReaction = null,
  isGuest = false,
}: ReviewCardProps) {
  const scoreColor =
    score >= 8
      ? "text-emerald-400"
      : score >= 6
        ? "text-yellow-400"
        : "text-rose-400";

  return (
    <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <UserLink
            userId=""
            userName={userName}
            userAvatar={userImage}
            userHandle={userHandle ?? null}
          />
          {updatedAt && (
            <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
              {timeAgo(updatedAt)}
            </p>
          )}
        </div>

        {/* Score badge */}
        <div className="flex items-baseline gap-0.5 bg-muted px-3 py-1 rounded-lg border border-border">
          <span className={cn("text-sm font-black", scoreColor)}>{score}</span>
          <span className="text-[10px] text-muted-foreground">/10</span>
        </div>
      </div>

      {/* Review text */}
      <p className="text-sm text-muted-foreground leading-relaxed italic">
        &ldquo;{review}&rdquo;
      </p>

      {/* Reaction bar (interactive) or summary badges (guest) */}
      {ratingId ? (
        isGuest ? (
          <ReactionSummaryBadges summary={reactionSummary} />
        ) : (
          <ReactionBar
            ratingId={ratingId}
            summary={reactionSummary}
            userReaction={userReaction}
            disabled={false}
          />
        )
      ) : (
        <ReactionSummaryBadges summary={reactionSummary} />
      )}
    </div>
  );
}
