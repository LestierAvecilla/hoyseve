import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { follows, users } from "@/lib/schema";
import { eq, and, lt, desc, sql } from "drizzle-orm";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const userId = searchParams.get("userId");
  const cursor = searchParams.get("cursor");
  const limitParam = searchParams.get("limit");

  if (!userId) {
    return NextResponse.json({ error: "Missing userId" }, { status: 400 });
  }

  const limit = Math.min(
    parseInt(limitParam ?? String(DEFAULT_LIMIT), 10) || DEFAULT_LIMIT,
    MAX_LIMIT
  );

  // Verify user exists
  const [targetUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!targetUser) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const session = await auth();
  const viewerId = session?.user?.id ?? null;

  try {
    // Fetch followers — users who follow targetUser (followingId = userId)
    // With cursor pagination on createdAt DESC
    const conditions = cursor
      ? and(eq(follows.followingId, userId), lt(follows.createdAt, new Date(cursor)))
      : eq(follows.followingId, userId);

      const rows = await db
      .select({
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
        username: users.username,
        createdAt: follows.createdAt,
      })
      .from(follows)
      .innerJoin(users, eq(follows.followerId, users.id))
      .where(conditions)
      .orderBy(desc(follows.createdAt))
      .limit(limit + 1);

    const hasNextPage = rows.length > limit;
    const items = hasNextPage ? rows.slice(0, limit) : rows;

    // Determine isFollowing for each item (viewer follows this follower?)
    let viewerFollowingIds: Set<string> = new Set();
    if (viewerId && items.length > 0) {
      const itemIds = items.map((r) => r.id);
      const viewerFollows = await db
        .select({ followingId: follows.followingId })
        .from(follows)
        .where(
          and(
            eq(follows.followerId, viewerId),
            sql`${follows.followingId} = ANY(ARRAY[${sql.join(itemIds.map((id) => sql`${id}`), sql`, `)}]::text[])`
          )
        );
      viewerFollowingIds = new Set(viewerFollows.map((r) => r.followingId));
    }

    const data = items.map((row) => ({
      id: row.id,
      name: row.name,
      handle: row.username ?? row.email.split("@")[0],
      avatarUrl: row.image,
      isFollowing: viewerFollowingIds.has(row.id),
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
    console.error("[followers GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
