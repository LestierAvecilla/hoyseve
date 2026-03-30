// ─── Base ────────────────────────────────────────────────────────────────────

const BASE_URL = "https://api.themoviedb.org/3";
const IMG_BASE = "https://image.tmdb.org/t/p";

// ─── Tipos ───────────────────────────────────────────────────────────────────

export interface TMDBMovie {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  genre_ids: number[];
  popularity: number;
}

export interface TMDBGenre {
  id: number;
  name: string;
}

export interface TMDBProductionCompany {
  id: number;
  name: string;
  logo_path: string | null;
  origin_country: string;
}

export interface TMDBMovieDetail {
  id: number;
  title: string;
  original_title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  release_date: string;
  runtime: number | null;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  status: string;
  tagline: string;
}

export interface TMDBTVDetail {
  id: number;
  name: string;
  original_name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  vote_count: number;
  first_air_date: string;
  last_air_date: string;
  episode_run_time: number[];
  number_of_seasons: number;
  number_of_episodes: number;
  genres: TMDBGenre[];
  production_companies: TMDBProductionCompany[];
  status: string;
  tagline: string;
  networks: { id: number; name: string; logo_path: string | null }[];
}

/** Vista unificada para la página de detalle — igual para movie y tv */
export interface TitleDetail {
  id: number;
  mediaType: "movie" | "tv";
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  releaseDate: string;
  runtime: string;         // formateado
  genres: string[];
  tagline: string;
  studios: string[];
}

export interface TMDBCastMember {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface TMDBCrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface TMDBCredits {
  id: number;
  cast: TMDBCastMember[];
  crew: TMDBCrewMember[];
}

export interface TMDBSearchResult {
  id: number;
  media_type: "movie" | "tv" | "person";
  title?: string;         // movie
  name?: string;          // tv / person
  poster_path: string | null;
  release_date?: string;  // movie
  first_air_date?: string; // tv
  vote_average?: number;
}

// ─── Cliente base ─────────────────────────────────────────────────────────────

async function fetchTMDB<T>(
  endpoint: string,
  params: Record<string, string> = {},
  language: string = "es-MX"
): Promise<T> {
  const token = process.env.TMDB_ACCESS_TOKEN;
  if (!token) throw new Error("TMDB_ACCESS_TOKEN no está definido en .env.local");

  const url = new URL(`${BASE_URL}/${endpoint}`);
  url.searchParams.set("language", language);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, v);
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: token,
      "Content-Type": "application/json",
    },
    next: { revalidate: 3600 }, // cache de 1 hora
  });

  if (!res.ok) {
    throw new Error(`TMDB fetch error ${res.status}: ${endpoint}`);
  }

  return res.json() as Promise<T>;
}

// ─── Helpers de imágenes ──────────────────────────────────────────────────────

export function posterUrl(path: string | null, size: string = "w500"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function backdropUrl(path: string | null, size: string = "w1280"): string {
  if (!path) return "";
  return `${IMG_BASE}/${size}${path}`;
}

export function profileUrl(path: string | null): string {
  if (!path) return "";
  return `${IMG_BASE}/w185${path}`;
}

// ─── Mapa de géneros (TMDB usa ids numéricos en /trending) ────────────────────

export const GENRE_MAP: Record<number, string> = {
  28: "Acción",
  12: "Aventura",
  16: "Animación",
  35: "Comedia",
  80: "Crimen",
  99: "Documental",
  18: "Drama",
  10751: "Familia",
  14: "Fantasía",
  36: "Historia",
  27: "Terror",
  10402: "Música",
  9648: "Misterio",
  10749: "Romance",
  878: "Ciencia ficción",
  10770: "Película de TV",
  53: "Thriller",
  10752: "Bélica",
  37: "Western",
};

// ─── Tipos para similar TV ────────────────────────────────────────────────────

export interface TMDBTVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  vote_average: number;
  first_air_date: string;
  genre_ids: number[];
}

// ─── Funciones públicas ───────────────────────────────────────────────────────

/** Top 10 películas de la semana */
export async function getTrending(): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>("trending/movie/week", {}, "es-MX");
  return data.results.slice(0, 10);
}

/** Detalle completo de una película por id */
export async function getMovieDetail(id: string | number): Promise<TMDBMovieDetail> {
  return fetchTMDB<TMDBMovieDetail>(`movie/${id}`, {}, "es-MX");
}

/** Detalle completo de una serie TV por id */
export async function getTVDetail(id: string | number): Promise<TMDBTVDetail> {
  return fetchTMDB<TMDBTVDetail>(`tv/${id}`, {}, "es-MX");
}

/** Créditos (cast + crew) de una película */
export async function getMovieCredits(id: string | number): Promise<TMDBCredits> {
  return fetchTMDB<TMDBCredits>(`movie/${id}/credits`, {}, "es-MX");
}

/** Créditos (cast + crew) de una serie TV */
export async function getTVCredits(id: string | number): Promise<TMDBCredits> {
  return fetchTMDB<TMDBCredits>(`tv/${id}/credits`, {}, "es-MX");
}

/** Películas similares */
export async function getSimilarMovies(id: string | number): Promise<TMDBMovie[]> {
  const data = await fetchTMDB<{ results: TMDBMovie[] }>(`movie/${id}/similar`, {}, "es-MX");
  return data.results.slice(0, 6);
}

/** Series similares */
export async function getSimilarTV(id: string | number): Promise<TMDBTVShow[]> {
  const data = await fetchTMDB<{ results: TMDBTVShow[] }>(`tv/${id}/similar`, {}, "es-MX");
  return data.results.slice(0, 6);
}

/** Búsqueda multi (movies + tv, excluye persons) */
export async function searchMulti(query: string, language: string = "es-MX"): Promise<TMDBSearchResult[]> {
  const data = await fetchTMDB<{ results: TMDBSearchResult[] }>("search/multi", {
    query,
    include_adult: "false",
  }, language);
  return data.results
    .filter((r) => r.media_type === "movie" || r.media_type === "tv")
    .slice(0, 8);
}

/** Formatea runtime en minutos → "2h 15m" */
export function formatRuntime(minutes: number | null): string {
  if (!minutes) return "N/A";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

/** Formatea fecha ISO → "23 dic. 2020" */
export function formatDate(dateStr: string): string {
  if (!dateStr) return "N/A";
  return new Date(dateStr).toLocaleDateString("es-MX", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}
