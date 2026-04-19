import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { follows } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const targetUserId = searchParams.get("targetUserId");

  if (!targetUserId) {
    return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  }

  try {
    // Check if current user is following target
    const [isFollowingRow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, session.user.id),
          eq(follows.followingId, targetUserId)
        )
      )
      .limit(1);

    // Check if target is following current user
    const [isFollowedByRow] = await db
      .select()
      .from(follows)
      .where(
        and(
          eq(follows.followerId, targetUserId),
          eq(follows.followingId, session.user.id)
        )
      )
      .limit(1);

    return NextResponse.json({
      isFollowing: !!isFollowingRow,
      isFollowedBy: !!isFollowedByRow,
    });
  } catch (err) {
    console.error("[follows/check GET]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
