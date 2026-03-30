import Image from "next/image";
import { cn } from "@/lib/utils";
import { t } from "@/lib/i18n";

interface ReviewCardProps {
  userName: string;
  userImage: string | null;
  score: number;
  review: string;
  updatedAt?: Date;
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

export function ReviewCard({
  userName,
  userImage,
  score,
  review,
  updatedAt,
}: ReviewCardProps) {
  const scoreColor =
    score >= 8
      ? "text-emerald-400"
      : score >= 6
        ? "text-yellow-400"
        : "text-rose-400";

  const initials = userName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-card p-6 rounded-2xl border border-border space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar real o inicial */}
          <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 overflow-hidden relative">
            {userImage ? (
              <Image
                src={userImage}
                alt={userName}
                fill
                className="object-cover"
                sizes="40px"
              />
            ) : (
              <span className="text-xs font-black text-primary">{initials}</span>
            )}
          </div>
          <div>
            <p className="text-sm font-bold text-foreground">{userName}</p>
            {updatedAt && (
              <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">
                {timeAgo(updatedAt)}
              </p>
            )}
          </div>
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
    </div>
  );
}
