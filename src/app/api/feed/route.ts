import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { activities, users, follows, ratings, reviewReactions } from "@/lib/schema";
import { eq, and, lt, desc, inArray } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const filter = searchParams.get("filter") ?? "following";
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const viewerId = session.user.id;

  const limit = Math.min(
    parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  try {
    let rows;

    if (filter === "global") {
      const conditions = cursor
        ? lt(activities.createdAt, new Date(cursor))
        : undefined;

      rows = await db
        .select({
          id: activities.id,
          userId: activities.userId,
          type: activities.type,
          tmdbId: activities.tmdbId,
          source: activities.source,
          mediaType: activities.mediaType,
          score: activities.score,
          review: activities.review,
          title: activities.title,
          posterPath: activities.posterPath,
          createdAt: activities.createdAt,
          userName: users.name,
          userAvatar: users.image,
          userHandle: users.username,
          ratingId: ratings.id,
        })
        .from(activities)
        .innerJoin(users, eq(activities.userId, users.id))
        .leftJoin(
          ratings,
          and(
            eq(ratings.userId, activities.userId),
            eq(ratings.tmdbId, activities.tmdbId),
            eq(ratings.mediaType, activities.mediaType),
            eq(ratings.source, activities.source)
          )
        )
        .where(conditions)
        .orderBy(desc(activities.createdAt))
        .limit(limit + 1);
    } else {
      // following filter
      const followingIds = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(eq(follows.followerId, viewerId));

      const followingIdList = followingIds.map((f) => f.followingId);

      if (followingIdList.length === 0) {
        return NextResponse.json({
          data: [],
          meta: { nextCursor: null, hasNextPage: false },
        });
      }

      const conditions = cursor
        ? and(
            inArray(activities.userId, followingIdList),
            lt(activities.createdAt, new Date(cursor))
          )
        : inArray(activities.userId, followingIdList);

      rows = await db
        .select({
          id: activities.id,
          userId: activities.userId,
          type: activities.type,
          tmdbId: activities.tmdbId,
          source: activities.source,
          mediaType: activities.mediaType,
          score: activities.score,
          review: activities.review,
          title: activities.title,
          posterPath: activities.posterPath,
          createdAt: activities.createdAt,
          userName: users.name,
          userAvatar: users.image,
          userHandle: users.username,
          ratingId: ratings.id,
        })
        .from(activities)
        .innerJoin(users, eq(activities.userId, users.id))
        .leftJoin(
          ratings,
          and(
            eq(ratings.userId, activities.userId),
            eq(ratings.tmdbId, activities.tmdbId),
            eq(ratings.mediaType, activities.mediaType),
            eq(ratings.source, activities.source)
          )
        )
        .where(conditions)
        .orderBy(desc(activities.createdAt))
        .limit(limit + 1);
    }

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    // Collect all ratingIds to batch-fetch reactions
    const ratingIds = items
      .map((row) => row.ratingId)
      .filter((id): id is string => id !== null);

    // Batch-fetch reaction summaries and viewer reactions
    type ReactionType = "like" | "love" | "surprise" | "angry";
    const summaryByRatingId: Record<string, Record<string, number>> = {};
    const userReactionByRatingId: Record<string, ReactionType> = {};

    if (ratingIds.length > 0) {
      const reactionRows = await db
        .select({
          ratingId: reviewReactions.ratingId,
          reactionType: reviewReactions.reactionType,
          reactorUserId: reviewReactions.userId,
        })
        .from(reviewReactions)
        .where(inArray(reviewReactions.ratingId, ratingIds));

      for (const row of reactionRows) {
        if (!summaryByRatingId[row.ratingId]) {
          summaryByRatingId[row.ratingId] = {};
        }
        summaryByRatingId[row.ratingId][row.reactionType] =
          (summaryByRatingId[row.ratingId][row.reactionType] ?? 0) + 1;

        if (row.reactorUserId === viewerId) {
          userReactionByRatingId[row.ratingId] = row.reactionType as ReactionType;
        }
      }
    }

    const data = items.map((row) => ({
      id: row.id,
      userId: row.userId,
      userName: row.userName ?? "Unknown",
      userAvatar: row.userAvatar,
      userHandle: row.userHandle ?? null,
      type: row.type,
      tmdbId: row.tmdbId,
      mediaType: row.mediaType,
      source: row.source,
      score: row.score,
      review: row.review,
      title: row.title,
      posterPath: row.posterPath,
      createdAt: row.createdAt.toISOString(),
      ratingId: row.ratingId ?? null,
      reactionSummary: row.ratingId ? (summaryByRatingId[row.ratingId] ?? {}) : {},
      userReaction: row.ratingId ? (userReactionByRatingId[row.ratingId] ?? null) : null,
    }));

    const nextCursor =
      hasNextPage && items.length > 0
        ? items[items.length - 1].createdAt.toISOString()
        : null;

    return NextResponse.json({
      data,
      meta: {
        nextCursor,
        hasNextPage,
      },
    });
  } catch (err) {
    console.error("[feed GET]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
