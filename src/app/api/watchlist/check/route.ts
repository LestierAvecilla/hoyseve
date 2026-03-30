import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { watchlist } from "@/lib/schema";
import { eq, and } from "drizzle-orm";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ inWatchlist: false });
  }

  const { searchParams } = new URL(req.url);
  const tmdbId = searchParams.get("tmdbId");
  const mediaType = searchParams.get("mediaType");

  if (!tmdbId || !mediaType) {
    return NextResponse.json({ error: "Missing params" }, { status: 400 });
  }

  const [item] = await db
    .select({ id: watchlist.id })
    .from(watchlist)
    .where(
      and(
        eq(watchlist.userId, session.user.id),
        eq(watchlist.tmdbId, Number(tmdbId)),
        eq(watchlist.mediaType, mediaType as "movie" | "tv")
      )
    )
    .limit(1);

  return NextResponse.json({ inWatchlist: !!item });
}
