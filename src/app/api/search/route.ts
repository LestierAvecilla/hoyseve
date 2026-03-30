import { searchAnime } from "@/lib/anilist";
import { searchMulti, posterUrl } from "@/lib/tmdb";

function normalizeTitle(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return Response.json([]);
  }

  try {
    const [esResults, enResults, animeResults] = await Promise.all([
      searchMulti(q.trim(), "es-MX"),
      searchMulti(q.trim(), "en-US"),
      searchAnime(q.trim(), 1, 8),
    ]);

    // Deduplicar por "id-mediaType", preferir el resultado en español
    const seen = new Map<string, (typeof esResults)[number]>();
    for (const r of esResults) {
      seen.set(`${r.id}-${r.media_type}`, r);
    }
    for (const r of enResults) {
      const key = `${r.id}-${r.media_type}`;
      if (!seen.has(key)) {
        seen.set(key, r);
      }
    }

    const tmdbFormatted = Array.from(seen.values()).map((r) => ({
      id: r.id,
      source: "tmdb" as const,
      media_type: r.media_type,
      title: r.title ?? r.name ?? "",
      poster_url: r.poster_path ? posterUrl(r.poster_path, "w92") : null,
      year:
        r.release_date
          ? new Date(r.release_date).getFullYear()
          : r.first_air_date
          ? new Date(r.first_air_date).getFullYear()
          : null,
    }));

    const animeFormatted = animeResults.map((r) => ({
      id: r.id,
      source: "anilist" as const,
      media_type: "anime" as const,
      title: r.title.english ?? r.title.romaji ?? r.title.native ?? "",
      poster_url: r.coverImage.medium ?? r.coverImage.large ?? null,
      year: r.seasonYear,
    }));

    const combined = [...tmdbFormatted, ...animeFormatted];
    const deduped = new Map<string, (typeof combined)[number]>();
    const animeFingerprints = new Set(
      animeFormatted.map((item) => `${normalizeTitle(item.title)}-${item.year ?? "na"}`)
    );

    for (const item of combined) {
      const identityKey = `${item.source}-${item.media_type}-${item.id}`;
      const semanticKey = `${normalizeTitle(item.title)}-${item.year ?? "na"}`;

      if (item.source === "tmdb" && animeFingerprints.has(semanticKey) && item.media_type !== "movie") {
        continue;
      }

      if (!deduped.has(identityKey)) deduped.set(identityKey, item);
    }

    return Response.json(Array.from(deduped.values()).slice(0, 8));
  } catch {
    return Response.json([], { status: 500 });
  }
}
