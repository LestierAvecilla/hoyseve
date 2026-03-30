import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { CategoryTitleCard } from "@/components/categories/category-title-card";
import { discoverAnimeFiltered } from "@/lib/anilist";
import { t } from "@/lib/i18n";
import { discoverMovies, discoverSeries, GENRE_MAP, posterUrl } from "@/lib/tmdb";

type CategorySlug = "movies" | "series" | "anime";

function isCategorySlug(value: string): value is CategorySlug {
  return value === "movies" || value === "series" || value === "anime";
}

export const dynamic = "force-dynamic";

const PAGE_SIZE = 18;

const MOVIE_GENRES: Record<string, number> = {
  action: 28,
  comedy: 35,
  drama: 18,
  fantasy: 14,
  scifi: 878,
  romance: 10749,
  thriller: 53,
  animation: 16,
  adventure: 12,
};

const SERIES_GENRES: Record<string, number> = {
  action: 10759,
  comedy: 35,
  drama: 18,
  fantasy: 10765,
  scifi: 10765,
  romance: 10749,
  thriller: 9648,
  animation: 16,
  adventure: 10759,
};

const ANIME_GENRES = ["all", "Action", "Comedy", "Drama", "Fantasy", "Sci-Fi", "Romance", "Thriller", "Adventure"] as const;

function parsePage(value: string | undefined): number {
  const page = Number(value ?? "1");
  return Number.isFinite(page) && page > 0 ? page : 1;
}

function pageHref(category: CategorySlug, page: number, genre: string, sort: string): string {
  const params = new URLSearchParams();
  if (page > 1) params.set("page", String(page));
  if (genre !== "all") params.set("genre", genre);
  if (sort !== "popular") params.set("sort", sort);
  const query = params.toString();
  return query ? `/categories/${category}?${query}` : `/categories/${category}`;
}

function genreLabel(key: string): string {
  switch (key) {
    case "action": return t.category.genres.action;
    case "comedy": return t.category.genres.comedy;
    case "drama": return t.category.genres.drama;
    case "fantasy": return t.category.genres.fantasy;
    case "scifi": return t.category.genres.scifi;
    case "romance": return t.category.genres.romance;
    case "thriller": return t.category.genres.thriller;
    case "animation": return t.category.genres.animation;
    case "adventure": return t.category.genres.adventure;
    default: return t.category.allGenres;
  }
}

function animeGenreLabel(key: string): string {
  switch (key) {
    case "Action": return t.category.genres.action;
    case "Comedy": return t.category.genres.comedy;
    case "Drama": return t.category.genres.drama;
    case "Fantasy": return t.category.genres.fantasy;
    case "Sci-Fi": return t.category.genres.scifi;
    case "Romance": return t.category.genres.romance;
    case "Thriller": return t.category.genres.thriller;
    case "Adventure": return t.category.genres.adventure;
    default: return t.category.allGenres;
  }
}

function renderFilters(category: CategorySlug, page: number, genre: string, sort: string, totalPages: number, genreKeys: string[], genreLabeler: (key: string) => string) {
  return (
    <>
      <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6 mb-8 p-5 rounded-2xl border border-border bg-card">
        <div className="flex flex-col sm:flex-row gap-5">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{t.category.genre}</p>
            <div className="flex flex-wrap gap-2">
              {genreKeys.map((genreKey) => {
                const active = genre === genreKey;
                return (
                  <Link
                    key={genreKey}
                    href={pageHref(category, 1, genreKey, sort)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
                  >
                    {genreKey === "all" ? t.category.allGenres : genreLabeler(genreKey)}
                  </Link>
                );
              })}
            </div>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground font-bold mb-2">{t.category.sort}</p>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "popular", label: t.category.sortPopular },
                { key: "rating", label: t.category.sortRating },
                { key: "recent", label: t.category.sortRecent },
              ].map((option) => {
                const active = sort === option.key;
                return (
                  <Link
                    key={option.key}
                    href={pageHref(category, 1, genre, option.key)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border transition-colors ${active ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:text-foreground hover:border-primary/30"}`}
                  >
                    {option.label}
                  </Link>
                );
              })}
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{t.category.page(page, totalPages)}</p>
      </div>
    </>
  );
}

function renderPagination(category: CategorySlug, page: number, genre: string, sort: string, totalPages: number) {
  return (
    <div className="flex items-center justify-between mt-10">
      <Link
        href={page > 1 ? pageHref(category, page - 1, genre, sort) : "#"}
        className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${page > 1 ? "border-border text-foreground hover:border-primary/40 hover:text-primary" : "pointer-events-none border-border/50 text-muted-foreground/50"}`}
      >
        {t.category.previousPage}
      </Link>
      <Link
        href={page < totalPages ? pageHref(category, page + 1, genre, sort) : "#"}
        className={`px-4 py-2 rounded-xl border text-xs font-bold uppercase tracking-wider transition-colors ${page < totalPages ? "border-border text-foreground hover:border-primary/40 hover:text-primary" : "pointer-events-none border-border/50 text-muted-foreground/50"}`}
      >
        {t.category.nextPage}
      </Link>
    </div>
  );
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ page?: string; genre?: string; sort?: string }>;
}) {
  const { category } = await params;
  const resolvedSearchParams = await searchParams;
  const page = parsePage(resolvedSearchParams.page);
  const genre = resolvedSearchParams.genre ?? "all";
  const sort = resolvedSearchParams.sort ?? "popular";

  if (!isCategorySlug(category)) {
    notFound();
  }

  if (category === "movies") {
    const items = await discoverMovies({
      page,
      genreId: MOVIE_GENRES[genre],
      sortBy: sort === "rating" ? "vote_average.desc" : sort === "recent" ? "primary_release_date.desc" : "popularity.desc",
    });
    const totalPages = 20;

    return (
      <div className="px-10 py-10 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8">
          <ChevronLeft size={14} />
          {t.category.backHome}
        </Link>

        <div className="mb-10">
          <h1 className="font-black text-5xl tracking-tighter text-foreground mb-2 uppercase">
            {t.category.moviesTitle}
          </h1>
          <p className="text-muted-foreground text-sm">{t.category.moviesDescription}</p>
        </div>

        {renderFilters(category, page, genre, sort, totalPages, ["all", ...Object.keys(MOVIE_GENRES)], genreLabel)}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <CategoryTitleCard
              key={item.id}
              href={`/title/movie/${item.id}`}
              title={item.title}
              subtitle={item.genre_ids.slice(0, 2).map((id) => GENRE_MAP[id]).filter(Boolean).join(" • ") || t.category.notAvailable}
              rating={item.vote_average.toFixed(1)}
              posterUrl={item.poster_path ? posterUrl(item.poster_path, "w342") : null}
            />
          ))}
        </div>

        {renderPagination(category, page, genre, sort, totalPages)}
      </div>
    );
  }

  if (category === "series") {
    const items = await discoverSeries({
      page,
      genreId: SERIES_GENRES[genre],
      sortBy: sort === "rating" ? "vote_average.desc" : sort === "recent" ? "first_air_date.desc" : "popularity.desc",
    });
    const totalPages = 20;

    return (
      <div className="px-10 py-10 max-w-7xl mx-auto">
        <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8">
          <ChevronLeft size={14} />
          {t.category.backHome}
        </Link>

        <div className="mb-10">
          <h1 className="font-black text-5xl tracking-tighter text-foreground mb-2 uppercase">
            {t.category.seriesTitle}
          </h1>
          <p className="text-muted-foreground text-sm">{t.category.seriesDescription}</p>
        </div>

        {renderFilters(category, page, genre, sort, totalPages, ["all", ...Object.keys(SERIES_GENRES)], genreLabel)}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <CategoryTitleCard
              key={item.id}
              href={`/title/tv/${item.id}`}
              title={item.name}
              subtitle={item.genre_ids.slice(0, 2).map((id) => GENRE_MAP[id]).filter(Boolean).join(" • ") || t.category.notAvailable}
              rating={item.vote_average.toFixed(1)}
              posterUrl={item.poster_path ? posterUrl(item.poster_path, "w342") : null}
            />
          ))}
        </div>

        {renderPagination(category, page, genre, sort, totalPages)}
      </div>
    );
  }

  const animeData = await discoverAnimeFiltered({
    page,
    perPage: PAGE_SIZE,
    genre,
    sort: sort === "rating" ? ["SCORE_DESC"] : sort === "recent" ? ["START_DATE_DESC"] : ["POPULARITY_DESC"],
  });
  const items = animeData.media;
  const totalPages = Math.max(animeData.pageInfo.lastPage, 1);

  return (
    <div className="px-10 py-10 max-w-7xl mx-auto">
      <Link href="/" className="inline-flex items-center gap-2 text-xs uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors mb-8">
        <ChevronLeft size={14} />
        {t.category.backHome}
      </Link>

      <div className="mb-10">
        <h1 className="font-black text-5xl tracking-tighter text-foreground mb-2 uppercase">
          {t.category.animeTitle}
        </h1>
        <p className="text-muted-foreground text-sm">{t.category.animeDescription}</p>
      </div>

      {renderFilters(category, page, genre, sort, totalPages, [...ANIME_GENRES], animeGenreLabel)}

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-muted-foreground text-sm">{t.category.empty}</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-6">
          {items.map((item) => (
            <CategoryTitleCard
              key={item.id}
              href={`/anime/${item.id}`}
              title={item.title.english ?? item.title.romaji ?? item.title.native ?? t.category.notAvailable}
              subtitle={item.genres.slice(0, 2).join(" • ") || t.category.notAvailable}
              rating={item.averageScore ? (item.averageScore / 10).toFixed(1) : "--"}
              posterUrl={item.coverImage.large ?? item.coverImage.medium ?? null}
            />
          ))}
        </div>
      )}

      {renderPagination(category, page, genre, sort, totalPages)}
    </div>
  );
}
