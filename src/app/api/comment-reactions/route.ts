import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { commentReactions, reviewComments } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const VALID_TYPES = ["hype", "sadness", "plot_twist", "skip"] as const;
type ValidReactionType = (typeof VALID_TYPES)[number];

function isValidType(type: unknown): type is ValidReactionType {
  return typeof type === "string" && (VALID_TYPES as readonly string[]).includes(type);
}

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

  const { commentId, type } = body as Record<string, unknown>;

  if (!commentId || typeof commentId !== "string" || !isValidType(type)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = session.user.id;

  // Validate commentId exists
  const [commentRow] = await db
    .select({ id: reviewComments.id })
    .from(reviewComments)
    .where(eq(reviewComments.id, commentId))
    .limit(1);

  if (!commentRow) {
    return NextResponse.json({ error: "Comment not found" }, { status: 404 });
  }

  // Toggle: if same type exists, delete; otherwise upsert
  const existing = await db.query.commentReactions.findFirst({
    where: and(
      eq(commentReactions.userId, userId),
      eq(commentReactions.commentId, commentId)
    ),
  });

  if (existing) {
    if (existing.reactionType === type) {
      // Same type — remove (toggle off)
      await db.delete(commentReactions).where(eq(commentReactions.id, existing.id));
    } else {
      // Different type — replace
      await db
        .update(commentReactions)
        .set({ reactionType: type })
        .where(eq(commentReactions.id, existing.id));
    }
  } else {
    // No existing reaction — insert
    await db.insert(commentReactions).values({
      userId,
      commentId,
      reactionType: type,
    });
  }

  // Build summary of all reactions for this comment
  const summaryRows = await db
    .select({ reactionType: commentReactions.reactionType })
    .from(commentReactions)
    .where(eq(commentReactions.commentId, commentId));

  const summary: Record<string, number> = {};
  for (const row of summaryRows) {
    summary[row.reactionType] = (summary[row.reactionType] ?? 0) + 1;
  }

  // Get user's current reaction (null if removed)
  const userReactionRow = await db.query.commentReactions.findFirst({
    where: and(
      eq(commentReactions.userId, userId),
      eq(commentReactions.commentId, commentId)
    ),
  });

  return NextResponse.json({
    success: true,
    userReaction: userReactionRow?.reactionType ?? null,
    summary,
  });
}
