"use client";

import { useState } from "react";
import { Trash2, MessageCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { UserLink } from "@/components/shared/user-link";
import { ReactionBar } from "@/components/shared/reaction-bar";
import { CommentInput } from "./comment-input";

export interface CommentUser {
  id: string;
  userName: string | null;
  userImage: string | null;
  userHandle: string | null;
  body: string;
  createdAt: Date;
}

interface CommentCardProps {
  id: string;
  userName: string | null;
  userImage: string | null;
  userHandle: string | null;
  body: string;
  createdAt: Date;
  isOwner: boolean;
  isGuest: boolean;
  isDeleted?: boolean;
  isReply?: boolean;
  replyCount?: number;
  reactionSummary?: Record<string, number>;
  userReaction?: string | null;
  onReply: (body: string) => Promise<void>;
  onOpenDeleteDialog: (id: string, replyCount: number) => void;
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

export function CommentCard({
  id,
  userName,
  userImage,
  userHandle,
  body,
  createdAt,
  isOwner,
  isGuest,
  isDeleted = false,
  isReply = false,
  replyCount = 0,
  reactionSummary = {},
  userReaction = null,
  onReply,
  onOpenDeleteDialog,
}: CommentCardProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);

  const handleReply = async (replyBody: string) => {
    await onReply(replyBody);
    setShowReplyForm(false);
  };

  return (
    <div className={cn("space-y-2", isReply && "ml-10 pl-4 border-l-2 border-border")}>
      {/* Header: user info + time */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <UserLink
            userId=""
            userName={userName ?? t.title.anonymous}
            userAvatar={userImage}
            userHandle={userHandle ?? null}
          />
          <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground whitespace-nowrap flex-shrink-0">
            {timeAgo(createdAt)}
          </span>
        </div>

        {/* Actions */}
        {!isGuest && !isDeleted && (
          <div className="flex items-center gap-1 flex-shrink-0">
            <button
              onClick={() => setShowReplyForm(!showReplyForm)}
              className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              title={t.comments.reply}
            >
              <MessageCircle size={14} />
            </button>
            {isOwner && (
              <button
                onClick={() => onOpenDeleteDialog(id, replyCount)}
                className="p-1 rounded-md text-muted-foreground hover:text-rose-400 hover:bg-muted transition-colors"
                title={t.comments.delete}
              >
                <Trash2 size={14} />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Body */}
      {isDeleted ? (
        <p className="text-sm text-muted-foreground italic leading-relaxed">
          [{t.comments.deleted}]
        </p>
      ) : (
        <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
      )}

      {/* Reaction bar */}
      {!isDeleted && (
        <ReactionBar
          targetId={id}
          apiPath="/api/comment-reactions"
          targetKey="commentId"
          summary={reactionSummary}
          userReaction={userReaction as "hype" | "sadness" | "plot_twist" | "skip" | null}
          disabled={isGuest}
        />
      )}

      {/* Inline reply form */}
      {showReplyForm && (
        <CommentInput
          placeholder={t.comments.replyPlaceholder}
          onSubmit={handleReply}
          onCancel={() => setShowReplyForm(false)}
          autoFocus
        />
      )}
    </div>
  );
}
