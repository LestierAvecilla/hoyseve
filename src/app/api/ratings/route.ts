import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { ratings } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

function isValidSource(source: unknown): source is "tmdb" | "anilist" {
  return source === "tmdb" || source === "anilist";
}

function isValidMediaType(mediaType: unknown): mediaType is "movie" | "tv" | "anime" {
  return mediaType === "movie" || mediaType === "tv" || mediaType === "anime";
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tmdbId, mediaType, score, review, source = "tmdb" } = await req.json();

    if (!tmdbId || !mediaType || !score || !source) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!isValidSource(source)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    if (!isValidMediaType(mediaType)) {
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
        source,
        mediaType,
        score: Number(score),
        review: review ?? null,
      })
      .onConflictDoUpdate({
        target: [ratings.userId, ratings.source, ratings.tmdbId, ratings.mediaType],
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
  const source = searchParams.get("source") ?? "tmdb";

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "Missing tmdbId or mediaType" }, { status: 400 });
  }

  if (!isValidSource(source) || !isValidMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const [rating] = await db
    .select()
    .from(ratings)
    .where(
      and(
        eq(ratings.userId, session.user.id),
        eq(ratings.source, source),
        eq(ratings.tmdbId, Number(tmdbId)),
        eq(ratings.mediaType, mediaType)
      )
    )
    .limit(1);

  return NextResponse.json(rating ?? null);
}
