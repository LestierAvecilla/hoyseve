"use client";

import { useState, useCallback } from "react";
import { MessageCircle } from "lucide-react";
import { t } from "@/lib/i18n";
import { CommentInput } from "./comment-input";
import { CommentList, type CommentWithUser } from "./comment-list";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";

interface CommentSectionProps {
  ratingId: string;
  commentCount: number;
  isGuest: boolean;
  currentUserId: string | null;
}

export function CommentSection({
  ratingId,
  commentCount,
  isGuest,
  currentUserId,
}: CommentSectionProps) {
  const [expanded, setExpanded] = useState(false);
  const [comments, setComments] = useState<CommentWithUser[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteDialogId, setDeleteDialogId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/comments?ratingId=${encodeURIComponent(ratingId)}`);
      if (!res.ok) {
        throw new Error("Failed to load comments");
      }
      const data = await res.json();
      setComments(data.comments);
    } catch {
      setError(t.comments.loadError);
    } finally {
      setLoading(false);
    }
  }, [ratingId]);

  const handleExpand = async () => {
    setExpanded(true);
    if (!comments) {
      await fetchComments();
    }
  };

  const handleCollapse = () => {
    setExpanded(false);
  };

  const handleAddComment = async (body: string) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratingId, body }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(data.error ?? "Failed to post comment");
    }

    const data = await res.json();
    // Optimistic: prepend new comment to list
    setComments((prev) => (prev ? [...prev, data.comment] : [data.comment]));
    // Update count
    setExpanded(true);
  };

  const handleAddReply = async (body: string, parentId: string) => {
    const res = await fetch("/api/comments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ratingId, body, parentId }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({ error: "Unknown error" }));
      throw new Error(data.error ?? "Failed to post reply");
    }

    const data = await res.json();
    setComments((prev) => (prev ? [...prev, data.comment] : [data.comment]));
  };

  const handleOpenDeleteDialog = (id: string, _replyCount: number) => {
    setDeleteDialogId(id);
  };

  const handleConfirmDelete = async () => {
    if (!deleteDialogId || deleting) return;
    setDeleting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: deleteDialogId }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(data.error ?? "Failed to delete comment");
      }

      // Re-fetch to get updated deletedAt from backend
      await fetchComments();
    } finally {
      setDeleting(false);
      setDeleteDialogId(null);
    }
  };

  const showCollapsed = !expanded;

  return (
    <div className="pt-2 border-t border-border mt-3">
      {showCollapsed ? (
        <div className="flex items-center gap-2">
          {commentCount > 0 ? (
            <button
              onClick={handleExpand}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle size={13} />
              {t.comments.show(commentCount)}
            </button>
          ) : (
            <>
              {!isGuest ? (
                <div className="flex items-center gap-2">
                  <MessageCircle size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t.comments.addComment}
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <MessageCircle size={13} className="text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">
                    {t.comments.signInToComment}
                  </span>
                </div>
              )}
              {!isGuest && (
                <button
                  onClick={handleExpand}
                  className="text-xs font-bold text-primary hover:text-primary/80 transition-colors"
                >
                  {t.comments.empty}
                </button>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {/* Header with collapse */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleCollapse}
              className="flex items-center gap-1.5 text-xs font-bold text-primary hover:text-primary/80 transition-colors"
            >
              <MessageCircle size={13} />
              {t.comments.hide}
            </button>
          </div>

          {/* Loading */}
          {loading && (
            <p className="text-xs text-muted-foreground py-4 text-center">
              {t.comments.loading}
            </p>
          )}

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-400 py-2">{error}</p>
          )}

          {/* Comment list */}
          {!loading && comments && (
            <CommentList
              comments={comments}
              isGuest={isGuest}
              currentUserId={currentUserId}
              onAddReply={handleAddReply}
              onOpenDeleteDialog={handleOpenDeleteDialog}
            />
          )}

          {/* New comment form (top-level) - at bottom */}
          {!isGuest && (
            <CommentInput
              placeholder={t.comments.addCommentPlaceholder}
              onSubmit={handleAddComment}
            />
          )}

          {isGuest && (
            <p className="text-xs text-muted-foreground py-1">
              {t.comments.signInToComment}
            </p>
          )}

          {/* Delete confirmation dialog */}
          <ConfirmDialog
            isOpen={deleteDialogId !== null}
            title={t.comments.deleteConfirm}
            description={t.comments.deleteNoUndo}
            variant="danger"
            confirmLabel={t.comments.delete}
            onConfirm={handleConfirmDelete}
            onCancel={() => setDeleteDialogId(null)}
            loading={deleting}
          />
        </div>
      )}
    </div>
  );
}
