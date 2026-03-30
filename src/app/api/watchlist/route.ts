import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

function isValidSource(source: unknown): source is "tmdb" | "anilist" {
  return source === "tmdb" || source === "anilist";
}

function isValidMediaType(mediaType: unknown): mediaType is "movie" | "tv" | "anime" {
  return mediaType === "movie" || mediaType === "tv" || mediaType === "anime";
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const items = await db
    .select()
    .from(watchlist)
    .where(eq(watchlist.userId, session.user.id))
    .orderBy(watchlist.addedAt);

  return NextResponse.json(items);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tmdbId, mediaType, title, posterPath, source = "tmdb" } = await req.json();

    if (!tmdbId || !mediaType || !title || !source) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!isValidSource(source)) {
      return NextResponse.json({ error: "Invalid source" }, { status: 400 });
    }

    if (!isValidMediaType(mediaType)) {
      return NextResponse.json({ error: "Invalid mediaType" }, { status: 400 });
    }

    const [item] = await db
      .insert(watchlist)
      .values({
        userId: session.user.id,
        tmdbId: Number(tmdbId),
        source,
        mediaType,
        title,
        posterPath: posterPath ?? null,
      })
      .onConflictDoNothing()
      .returning();

    return NextResponse.json(item ?? { message: "Already in watchlist" });
  } catch (err) {
    console.error("[watchlist POST]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
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

  await db
    .delete(watchlist)
    .where(
      and(
        eq(watchlist.userId, session.user.id),
        eq(watchlist.source, source),
        eq(watchlist.tmdbId, Number(tmdbId)),
        eq(watchlist.mediaType, mediaType)
      )
    );

  return NextResponse.json({ ok: true });
}

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { tmdbId, mediaType, watched, source = "tmdb" } = await req.json();

    if (!tmdbId || !mediaType || watched === undefined || !source) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (!isValidSource(source) || !isValidMediaType(mediaType)) {
      return NextResponse.json({ error: "Invalid params" }, { status: 400 });
    }

    const [item] = await db
      .update(watchlist)
      .set({ watched: Boolean(watched) })
      .where(
        and(
          eq(watchlist.userId, session.user.id),
          eq(watchlist.source, source),
          eq(watchlist.tmdbId, Number(tmdbId)),
          eq(watchlist.mediaType, mediaType)
        )
      )
      .returning();

    return NextResponse.json(item);
  } catch (err) {
    console.error("[watchlist PATCH]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
