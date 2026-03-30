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

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ inWatchlist: false });
  }

  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType");
  const source = searchParams.get("source") ?? "tmdb";

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  if (!isValidSource(source) || !isValidMediaType(mediaType)) {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }

  const [item] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, session.user.id),
        eq(watchlist.source, source),
        eq(watchlist.tmdbId, Number(tmdbId)),
        eq(watchlist.mediaType, mediaType)
      )
    )
    .limit(1);

  return NextResponse.json({ inWatchlist: !!item });
}
