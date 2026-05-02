"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";
import { t } from "@/lib/i18n";
import { CommentCard } from "./comment-card";

export interface CommentWithUser {
  id: string;
  ratingId: string;
  userId: string;
  parentId: string | null;
  body: string;
  createdAt: string;
  deletedAt: string | null;
  userName: string | null;
  userImage: string | null;
  userHandle: string | null;
  reactionSummary: Record<string, number>;
  userReaction: string | null;
}

const INITIAL_VISIBLE_ROOTS = 3;

interface CommentListProps {
  comments: CommentWithUser[];
  isGuest: boolean;
  currentUserId: string | null;
  onAddReply: (body: string, parentId: string) => Promise<void>;
  onOpenDeleteDialog: (id: string, replyCount: number) => void;
}

export function CommentList({
  comments,
  isGuest,
  currentUserId,
  onAddReply,
  onOpenDeleteDialog,
}: CommentListProps) {
  const [showAllRoots, setShowAllRoots] = useState(false);
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());

  const rootComments = comments.filter((c) => c.parentId === null);
  const visibleRoots = showAllRoots
    ? rootComments
    : rootComments.slice(0, INITIAL_VISIBLE_ROOTS);
  const hiddenCount = rootComments.length - INITIAL_VISIBLE_ROOTS;

  const toggleReplies = (parentId: string) => {
    setExpandedReplies((prev) => {
      const next = new Set(prev);
      if (next.has(parentId)) {
        next.delete(parentId);
      } else {
        next.add(parentId);
      }
      return next;
    });
  };

  return (
    <div className="space-y-4 pt-2">
      {visibleRoots.map((comment) => {
        // Find direct replies only (1 level — per spec "1 nivel de nesting visible")
        const replies = comments.filter((c) => c.parentId === comment.id);
        const repliesExpanded = expandedReplies.has(comment.id);

        return (
          <div key={comment.id} className="space-y-2">
            <CommentCard
              id={comment.id}
              userName={comment.userName}
              userImage={comment.userImage}
              userHandle={comment.userHandle}
              body={comment.body}
              createdAt={new Date(comment.createdAt)}
              isOwner={currentUserId === comment.userId}
              isGuest={isGuest}
              isDeleted={comment.deletedAt !== null}
              replyCount={replies.length}
              reactionSummary={comment.reactionSummary}
              userReaction={comment.userReaction}
              onReply={(body) => onAddReply(body, comment.id)}
              onOpenDeleteDialog={onOpenDeleteDialog}
            />

            {/* Reply toggle */}
            {replies.length > 0 && (
              <button
                onClick={() => toggleReplies(comment.id)}
                className="flex items-center gap-1 ml-10 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
              >
                {repliesExpanded ? (
                  <>
                    <ChevronUp size={12} />
                    {t.comments.hideReplies}
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} />
                    {t.comments.showReplies(replies.length)}
                  </>
                )}
              </button>
            )}

            {/* Replies (flat rendering) */}
            {repliesExpanded &&
              replies.map((reply) => {
                const replyReplies = comments.filter((c) => c.parentId === reply.id);
                return (
                  <CommentCard
                    key={reply.id}
                    id={reply.id}
                    userName={reply.userName}
                    userImage={reply.userImage}
                    userHandle={reply.userHandle}
                    body={reply.body}
                    createdAt={new Date(reply.createdAt)}
                    isOwner={currentUserId === reply.userId}
                    isGuest={isGuest}
                    isDeleted={reply.deletedAt !== null}
                    replyCount={replyReplies.length}
                    isReply
                    reactionSummary={reply.reactionSummary}
                    userReaction={reply.userReaction}
                    onReply={(body) => onAddReply(body, comment.id)}
                    onOpenDeleteDialog={onOpenDeleteDialog}
                  />
                );
              })}
          </div>
        );
      })}

      {/* "Ver N más" for overflow root comments */}
      {hiddenCount > 0 && !showAllRoots && (
        <button
          onClick={() => setShowAllRoots(true)}
          className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
        >
          <ChevronDown size={12} />
          {t.comments.loadMore(hiddenCount)}
        </button>
      )}
    </div>
  );
}
