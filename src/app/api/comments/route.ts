import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewComments, ratings, users, commentReactions } from "@/lib/schema";
import { eq, and, asc, inArray, isNull } from "drizzle-orm";

// ─── GET: fetch comments for a rating (public) ─────────────────────────────────

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ratingId = searchParams.get("ratingId");

  if (!ratingId || typeof ratingId !== "string") {
    return NextResponse.json({ error: "Missing or invalid ratingId" }, { status: 400 });
  }

  try {
    const rows = await db
      .select({
        id: reviewComments.id,
        ratingId: reviewComments.ratingId,
        userId: reviewComments.userId,
        parentId: reviewComments.parentId,
        body: reviewComments.body,
        createdAt: reviewComments.createdAt,
        deletedAt: reviewComments.deletedAt,
        userName: users.name,
        userImage: users.image,
        userHandle: users.username,
      })
      .from(reviewComments)
      .innerJoin(users, eq(reviewComments.userId, users.id))
      .where(eq(reviewComments.ratingId, ratingId))
      .orderBy(asc(reviewComments.createdAt));

    // Enrich with reaction data (batch queries — no N+1)
    const commentIds = rows.map((r) => r.id);

    // Query 1: reaction summaries per comment
    const summaryRows = commentIds.length > 0
      ? await db
          .select({
            commentId: commentReactions.commentId,
            reactionType: commentReactions.reactionType,
          })
          .from(commentReactions)
          .where(inArray(commentReactions.commentId, commentIds))
      : [];

    // Build summary: { commentId → { reactionType → count } }
    const summaryByComment: Record<string, Record<string, number>> = {};
    for (const row of summaryRows) {
      if (!summaryByComment[row.commentId]) {
        summaryByComment[row.commentId] = {};
      }
      summaryByComment[row.commentId][row.reactionType] =
        (summaryByComment[row.commentId][row.reactionType] ?? 0) + 1;
    }

    // Query 2: user's reaction per comment (authenticated only)
    const session = await auth();
    const userId = session?.user?.id ?? null;

    const userReactionsByComment: Record<string, string> = {};
    if (userId && commentIds.length > 0) {
      const userRows = await db
        .select({
          commentId: commentReactions.commentId,
          reactionType: commentReactions.reactionType,
        })
        .from(commentReactions)
        .where(
          and(
            eq(commentReactions.userId, userId),
            inArray(commentReactions.commentId, commentIds)
          )
        );

      for (const row of userRows) {
        userReactionsByComment[row.commentId] = row.reactionType;
      }
    }

    // Merge reaction data into comments
    const comments = rows.map((row) => ({
      ...row,
      reactionSummary: summaryByComment[row.id] ?? {},
      userReaction: userId ? (userReactionsByComment[row.id] ?? null) : null,
    }));

    return NextResponse.json({ comments });
  } catch (err) {
    console.error("[comments GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── POST: create a comment (auth required) ───────────────────────────────────

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { ratingId, body: commentBody, parentId } = body as Record<string, unknown>;

  if (!ratingId || typeof ratingId !== "string") {
    return NextResponse.json({ error: "Missing or invalid ratingId" }, { status: 400 });
  }

  if (!commentBody || typeof commentBody !== "string") {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  const trimmedBody = commentBody.trim();
  if (trimmedBody.length === 0) {
    return NextResponse.json({ error: "Body is empty" }, { status: 400 });
  }

  if (trimmedBody.length > 1000) {
    return NextResponse.json({ error: "Body too long (max 1000 chars)" }, { status: 400 });
  }

  try {
    // Validate rating exists
    const [ratingRow] = await db
      .select({ id: ratings.id })
      .from(ratings)
      .where(eq(ratings.id, ratingId))
      .limit(1);

    if (!ratingRow) {
      return NextResponse.json({ error: "Rating not found" }, { status: 404 });
    }

    // If parentId provided, validate it exists and belongs to same rating
    if (parentId) {
      if (typeof parentId !== "string") {
        return NextResponse.json({ error: "Invalid parentId" }, { status: 400 });
      }

      const [parentRow] = await db
        .select({ id: reviewComments.id, ratingId: reviewComments.ratingId })
        .from(reviewComments)
        .where(eq(reviewComments.id, parentId))
        .limit(1);

      if (!parentRow) {
        return NextResponse.json({ error: "Parent comment not found" }, { status: 400 });
      }

      if (parentRow.ratingId !== ratingId) {
        return NextResponse.json(
          { error: "Parent comment does not belong to this review" },
          { status: 400 }
        );
      }
    }

    // Insert the comment
    const resolvedParentId: string | null =
      typeof parentId === "string" ? parentId : null;

    const [inserted] = await db
      .insert(reviewComments)
      .values({
        userId: session.user.id,
        ratingId,
        body: trimmedBody,
        parentId: resolvedParentId,
      })
      .returning();

    // Fetch the inserted comment with user info
    const [comment] = await db
      .select({
        id: reviewComments.id,
        ratingId: reviewComments.ratingId,
        userId: reviewComments.userId,
        parentId: reviewComments.parentId,
        body: reviewComments.body,
        createdAt: reviewComments.createdAt,
        deletedAt: reviewComments.deletedAt,
        userName: users.name,
        userImage: users.image,
        userHandle: users.username,
      })
      .from(reviewComments)
      .innerJoin(users, eq(reviewComments.userId, users.id))
      .where(eq(reviewComments.id, inserted.id))
      .limit(1);

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err) {
    console.error("[comments POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── DELETE: soft-delete own comment (auth + owner-only) ──────────────────────

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { id } = body as Record<string, unknown>;

  if (!id || typeof id !== "string") {
    return NextResponse.json({ error: "Missing or invalid id" }, { status: 400 });
  }

  try {
    // Check ownership
    const [comment] = await db
      .select({ userId: reviewComments.userId, deletedAt: reviewComments.deletedAt })
      .from(reviewComments)
      .where(eq(reviewComments.id, id))
      .limit(1);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    if (comment.userId !== session.user.id) {
      return NextResponse.json({ error: "Not authorized to delete this comment" }, { status: 403 });
    }

    // Soft-delete: always update deletedAt (never physical delete to avoid CASCADE killing replies)
    await db
      .update(reviewComments)
      .set({ deletedAt: new Date() })
      .where(eq(reviewComments.id, id));

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[comments DELETE]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
