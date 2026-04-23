import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { reviewReactions } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

const VALID_TYPES = ["like", "love", "surprise", "angry"] as const;
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

  const { ratingId, type } = body as Record<string, unknown>;

  if (!ratingId || typeof ratingId !== "string" || !isValidType(type)) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const userId = session.user.id;

  // Toggle: if same type exists, delete; otherwise upsert
  const existing = await db.query.reviewReactions.findFirst({
    where: and(
      eq(reviewReactions.userId, userId),
      eq(reviewReactions.ratingId, ratingId)
    ),
  });

  if (existing) {
    if (existing.reactionType === type) {
      // Same type — remove (toggle off)
      await db.delete(reviewReactions).where(eq(reviewReactions.id, existing.id));
    } else {
      // Different type — replace
      await db
        .update(reviewReactions)
        .set({ reactionType: type })
        .where(eq(reviewReactions.id, existing.id));
    }
  } else {
    // No existing reaction — insert
    await db.insert(reviewReactions).values({
      userId,
      ratingId,
      reactionType: type,
    });
  }

  // Build summary of all reactions for this rating
  const summaryRows = await db
    .select({ reactionType: reviewReactions.reactionType })
    .from(reviewReactions)
    .where(eq(reviewReactions.ratingId, ratingId));

  const summary: Record<string, number> = {};
  for (const row of summaryRows) {
    summary[row.reactionType] = (summary[row.reactionType] ?? 0) + 1;
  }

  // Get user's current reaction (null if removed)
  const userReactionRow = await db.query.reviewReactions.findFirst({
    where: and(
      eq(reviewReactions.userId, userId),
      eq(reviewReactions.ratingId, ratingId)
    ),
  });

  return NextResponse.json({
    success: true,
    userReaction: userReactionRow?.reactionType ?? null,
    summary,
  });
}
