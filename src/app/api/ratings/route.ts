import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ratings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tmdbId, mediaType, score, review } = await req.json();

    if (!tmdbId || !mediaType || !score) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!["movie", "tv"].includes(mediaType)) {
      return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
    }

    if (score < 1 || score > 10) {
      return NextResponse.json({ error: "Score must be 1-10" }, { status: 400 });
    }

    // Upsert: insert or update on conflict
    const [result] = await db
      .insert(ratings)
      .values({
        userId: session.user.id,
        tmdbId: Number(tmdbId),
        mediaType,
        score: Number(score),
        review: review ?? null,
      })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.tmdbId, ratings.mediaType],
        set: {
          score: Number(score),
          review: review ?? null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json(result);
  } catch (err) {
    console.error("[ratings POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType");

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType" }, { status: 400 });
  }

  const [rating] = await db
    .select()
    .from(ratings)
    .where(
      and(
        eq(ratings.userId, session.user.id),
        eq(ratings.tmdbId, Number(tmdbId)),
        eq(ratings.mediaType, mediaType as "movie" | "tv")
      )
    )
    .limit(1);

  return NextResponse.json(rating ?? null);
}
