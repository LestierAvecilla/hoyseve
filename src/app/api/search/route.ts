import { searchMulti, posterUrl } from "@/lib/tmdb";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") ?? "";

  if (q.trim().length < 2) {
    return Response.json([]);
  }

  try {
    // Búsqueda bilingüe en paralelo: es-MX + en-US
    const [esResults, enResults] = await Promise.all([
      searchMulti(q.trim(), "es-MX"),
      searchMulti(q.trim(), "en-US"),
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

    const merged = Array.from(seen.values()).slice(0, 8);

    const formatted = merged.map((r) => ({
      id: r.id,
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

    return Response.json(formatted);
  } catch {
    return Response.json([], { status: 500 });
  }
}
