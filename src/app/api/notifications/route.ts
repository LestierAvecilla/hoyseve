import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { notifications, users, ratings, reviewComments } from "@/lib/schema";
import { eq, desc, and, sql, inArray } from "drizzle-orm";
import { groupNotifications } from "@/lib/notifications/group";

// ─── GET: paginated grouped notification list ──────────────────────────────────

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") ?? "20", 10) || 20));
  const offset = (page - 1) * limit;

  try {
    const userId = session.user.id;

    // Fetch notifications with actor and target data
    const rawRows = await db
      .select({
        id: notifications.id,
        userId: notifications.userId,
        type: notifications.type,
        actorId: notifications.actorId,
        targetId: notifications.targetId,
        targetType: notifications.targetType,
        groupKey: notifications.groupKey,
        read: notifications.read,
        createdAt: notifications.createdAt,
        actorName: users.name,
        actorImage: users.image,
      })
      .from(notifications)
      .leftJoin(users, eq(notifications.actorId, users.id))
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(limit)
      .offset(offset);

    // Count total and unread
    const [countResult, unreadResult] = await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(eq(notifications.userId, userId)),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(notifications)
        .where(and(eq(notifications.userId, userId), eq(notifications.read, false))),
    ]);

    // Batch-fetch target previews and navigation URLs
    const targetPreviewMap: Record<string, string | null> = {};
    const navigateToMap: Record<string, string | null> = {};

    if (rawRows.length > 0) {
      const reviewIds = rawRows
        .filter((r) => r.targetType === "review")
        .map((r) => r.targetId);

      const commentIds = rawRows
        .filter((r) => r.targetType === "comment")
        .map((r) => r.targetId);

      if (reviewIds.length > 0) {
        const reviewRows = await db
          .select({
            id: ratings.id,
            review: ratings.review,
            tmdbId: ratings.tmdbId,
            source: ratings.source,
            mediaType: ratings.mediaType,
          })
          .from(ratings)
          .where(inArray(ratings.id, reviewIds));

        for (const row of reviewRows) {
          targetPreviewMap[row.id] = row.review
            ? row.review.substring(0, 50)
            : null;

          if (row.source === "anilist") {
            navigateToMap[row.id] = `/anime/${row.tmdbId}`;
          } else {
            navigateToMap[row.id] = `/title/${row.mediaType}/${row.tmdbId}`;
          }
        }
      }

      if (commentIds.length > 0) {
        // Fetch comment body + parent rating for navigation
        const commentRows = await db
          .select({
            id: reviewComments.id,
            body: reviewComments.body,
            ratingId: reviewComments.ratingId,
            deletedAt: reviewComments.deletedAt,
          })
          .from(reviewComments)
          .where(inArray(reviewComments.id, commentIds));

        for (const row of commentRows) {
          // Show deleted content message when deletedAt is set
          if (row.deletedAt != null) {
            targetPreviewMap[row.id] = null;
          } else {
            targetPreviewMap[row.id] = row.body.substring(0, 50);
          }
        }

        // Batch-fetch parent rating metadata for comment navigation
        const commentRatingIds = [...new Set(commentRows.map((c) => c.ratingId))];
        if (commentRatingIds.length > 0) {
          const ratingRows = await db
            .select({
              id: ratings.id,
              tmdbId: ratings.tmdbId,
              source: ratings.source,
              mediaType: ratings.mediaType,
            })
            .from(ratings)
            .where(inArray(ratings.id, commentRatingIds));

          const ratingIdToUrl = new Map<string, string>();
          for (const row of ratingRows) {
            ratingIdToUrl.set(
              row.id,
              row.source === "anilist"
                ? `/anime/${row.tmdbId}`
                : `/title/${row.mediaType}/${row.tmdbId}`
            );
          }

          // Map comment ID → parent rating URL
          for (const row of commentRows) {
            const url = ratingIdToUrl.get(row.ratingId);
            if (url) {
              navigateToMap[row.id] = url;
            }
          }
        }
      }
    }

    // Map raw rows to format expected by groupNotifications
    const mappedRows = rawRows.map((row) => ({
      ...row,
      targetPreview: targetPreviewMap[row.targetId] ?? null,
    }));

    const items = groupNotifications(mappedRows, { targetPreviewMap, navigateToMap });

    const totalCount = countResult[0]?.count ?? 0;
    const unreadCount = unreadResult[0]?.count ?? 0;
    const hasMore = offset + limit < totalCount;

    return NextResponse.json({ items, unreadCount, hasMore });
  } catch (err) {
    console.error("[notifications GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ─── PATCH: mark notifications as read ────────────────────────────────────────

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { notificationIds?: string[]; groupKey?: string };
  try {
    body = await req.json();
  } catch {
    body = {};
  }

  const userId = session.user.id;

  try {
    const { notificationIds, groupKey } = body;

    // Mark by groupKey (mark all notifications in the group as read)
    if (groupKey) {
      const result = await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, userId),
            eq(notifications.groupKey, groupKey),
            eq(notifications.read, false)
          )
        )
        .returning({ id: notifications.id });

      return NextResponse.json({
        success: true,
        updatedCount: result.length,
      });
    }

    if (notificationIds && notificationIds.length > 0) {
      // Mark specific notifications as read
      await db
        .update(notifications)
        .set({ read: true })
        .where(
          and(
            eq(notifications.userId, userId),
            inArray(notifications.id, notificationIds)
          )
        );

      return NextResponse.json({ success: true, updatedCount: notificationIds.length });
    }

    // Mark ALL as read
    const result = await db
      .update(notifications)
      .set({ read: true })
      .where(
        and(eq(notifications.userId, userId), eq(notifications.read, false))
      )
      .returning({ id: notifications.id });

    return NextResponse.json({
      success: true,
      updatedCount: result.length,
    });
  } catch (err) {
    console.error("[notifications PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
