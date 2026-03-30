const ANILIST_URL = "https://graphql.anilist.co";

export interface AniListMedia {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
    medium: string | null;
  };
  bannerImage: string | null;
  description: string | null;
  averageScore: number | null;
  episodes: number | null;
  duration: number | null;
  seasonYear: number | null;
  genres: string[];
  format: string | null;
  countryOfOrigin: string | null;
  type: "ANIME";
}

export interface AniListCharacter {
  id: number;
  name: {
    full: string | null;
  };
  image: {
    medium: string | null;
  };
}

export interface AniListStaff {
  id: number;
  name: {
    full: string | null;
  };
}

export interface AniListMediaRecommendation {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    large: string | null;
    medium: string | null;
  };
  averageScore: number | null;
  seasonYear: number | null;
  genres: string[];
}

export interface AniListMediaDetail extends AniListMedia {
  startDate: {
    year: number | null;
    month: number | null;
    day: number | null;
  };
  status: string | null;
  studios: {
    nodes: Array<{
      id: number;
      name: string;
    }>;
  };
  characters: {
    edges: Array<{
      role: string | null;
      node: AniListCharacter;
    }>;
  };
  staff: {
    edges: Array<{
      role: string | null;
      node: AniListStaff;
    }>;
  };
  recommendations: {
    nodes: Array<{
      mediaRecommendation: AniListMediaRecommendation | null;
    }>;
  };
}

interface AniListPageResponse {
  data: {
    Page: {
      media: AniListMedia[];
    };
  };
}

export interface AniListSearchMedia {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
    native: string | null;
  };
  coverImage: {
    medium: string | null;
    large: string | null;
  };
  seasonYear: number | null;
  averageScore: number | null;
  genres: string[];
  format: string | null;
}

interface AniListSearchResponse {
  data: {
    Page: {
      pageInfo: {
        currentPage: number;
        hasNextPage: boolean;
        lastPage: number;
      };
      media: AniListSearchMedia[];
    };
  };
}

export interface AniListSearchResponseData {
  pageInfo: {
    currentPage: number;
    hasNextPage: boolean;
    lastPage: number;
  };
  media: AniListSearchMedia[];
}

interface AniListMediaResponse {
  data: {
    Media: AniListMediaDetail | null;
  };
}

const DISCOVER_ANIME_QUERY = `
  query DiscoverAnime($page: Int!, $perPage: Int!) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: ANIME
        sort: POPULARITY_DESC
        countryOfOrigin: JP
        isAdult: false
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
        }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        duration
        seasonYear
        genres
        format
        countryOfOrigin
        type
      }
    }
  }
`;

const ANIME_DETAIL_QUERY = `
  query AnimeDetail($id: Int!) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
        english
        native
      }
      coverImage {
        extraLarge
        large
        medium
      }
      bannerImage
      description(asHtml: false)
      averageScore
      episodes
      duration
      seasonYear
      genres
      format
      countryOfOrigin
      type
      startDate {
        year
        month
        day
      }
      status
      studios(isMain: true) {
        nodes {
          id
          name
        }
      }
      characters(sort: ROLE, perPage: 6) {
        edges {
          role
          node {
            id
            name {
              full
            }
            image {
              medium
            }
          }
        }
      }
      staff(sort: RELEVANCE, perPage: 6) {
        edges {
          role
          node {
            id
            name {
              full
            }
          }
        }
      }
      recommendations(sort: RATING_DESC, perPage: 6) {
        nodes {
          mediaRecommendation {
            id
            title {
              romaji
              english
              native
            }
            coverImage {
              large
              medium
            }
            averageScore
            seasonYear
            genres
          }
        }
      }
    }
  }
`;

const SEARCH_ANIME_QUERY = `
  query SearchAnime($page: Int!, $perPage: Int!, $search: String!) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
      }
      media(type: ANIME, search: $search, sort: SEARCH_MATCH, isAdult: false) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          medium
          large
        }
        seasonYear
        averageScore
        genres
        format
      }
    }
  }
`;

const DISCOVER_FILTERED_ANIME_QUERY = `
  query DiscoverFilteredAnime($page: Int!, $perPage: Int!, $genre: String, $sort: [MediaSort]) {
    Page(page: $page, perPage: $perPage) {
      pageInfo {
        currentPage
        hasNextPage
        lastPage
      }
      media(
        type: ANIME
        sort: $sort
        countryOfOrigin: JP
        genre: $genre
        isAdult: false
      ) {
        id
        title {
          romaji
          english
          native
        }
        coverImage {
          extraLarge
          large
          medium
        }
        bannerImage
        description(asHtml: false)
        averageScore
        episodes
        duration
        seasonYear
        genres
        format
        countryOfOrigin
        type
      }
    }
  }
`;

async function fetchAniList<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  const res = await fetch(ANILIST_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 3600 },
  });

  if (!res.ok) {
    throw new Error(`AniList fetch error ${res.status}`);
  }

  return res.json() as Promise<T>;
}

export async function discoverAnime(page: number = 1, perPage: number = 18): Promise<AniListMedia[]> {
  const data = await fetchAniList<AniListPageResponse>(DISCOVER_ANIME_QUERY, {
    page,
    perPage,
  });

  return data.data.Page.media;
}

export async function discoverAnimeFiltered({
  page = 1,
  perPage = 18,
  genre,
  sort = ["POPULARITY_DESC"],
}: {
  page?: number;
  perPage?: number;
  genre?: string;
  sort?: string[];
}): Promise<AniListSearchResponseData> {
  const data = await fetchAniList<AniListSearchResponse>(DISCOVER_FILTERED_ANIME_QUERY, {
    page,
    perPage,
    genre: genre && genre !== "all" ? genre : undefined,
    sort,
  });

  return data.data.Page;
}

export async function getAnimeDetail(id: number): Promise<AniListMediaDetail | null> {
  const data = await fetchAniList<AniListMediaResponse>(ANIME_DETAIL_QUERY, { id });
  return data.data.Media;
}

export async function searchAnime(query: string, page: number = 1, perPage: number = 8): Promise<AniListSearchMedia[]> {
  const data = await fetchAniList<AniListSearchResponse>(SEARCH_ANIME_QUERY, {
    page,
    perPage,
    search: query,
  });

  return data.data.Page.media;
}

export function formatAniListDescription(description: string | null | undefined): string | null {
  if (!description) return null;

  const withBreaks = description
    .replace(/<br\s*\/?>(\s*)/gi, "\n")
    .replace(/<\/p>\s*<p>/gi, "\n\n");

  const withoutTags = withBreaks.replace(/<[^>]+>/g, "");

  const decoded = withoutTags
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&mdash;/g, "-")
    .replace(/&nbsp;/g, " ");

  return decoded
    .replace(/~!/g, "")
    .replace(/!~/g, "")
    .replace(/\r/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}
