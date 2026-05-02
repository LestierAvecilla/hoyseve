import { describe, it, expect } from "vitest";
import {
  extractWatchProviders,
  type TMDBWatchProvidersResponse,
  type TMDBWatchProviderEntry,
} from "@/lib/tmdb";

const IMG_BASE = "https://image.tmdb.org/t/p";

// ─── Helpers ───────────────────────────────────────────────────────────────────

function provider(overrides: Partial<TMDBWatchProviderEntry> = {}): TMDBWatchProviderEntry {
  return {
    logo_path: "/abc123.jpg",
    provider_id: 1,
    provider_name: "TestFlix",
    display_priority: 10,
    ...overrides,
  };
}

function response(
  regions: TMDBWatchProvidersResponse["results"]
): TMDBWatchProvidersResponse {
  return { id: 550, results: regions };
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe("extractWatchProviders", () => {
  // ── MX flatrate happy path ────────────────────────────────────────────────

  it("returns MX providers when MX has flatrate", () => {
    const result = extractWatchProviders(
      response({
        MX: { flatrate: [provider({ provider_name: "Netflix", display_priority: 1 })] },
        US: { flatrate: [provider({ provider_name: "Hulu", display_priority: 2 })] },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].providerName).toBe("Netflix");
  });

  // ── MX fallback to US ─────────────────────────────────────────────────────

  it("falls back to US providers when MX exists but flatrate is empty", () => {
    const result = extractWatchProviders(
      response({
        MX: { flatrate: [] },
        US: { flatrate: [provider({ provider_name: "Hulu", display_priority: 1 })] },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].providerName).toBe("Hulu");
  });

  it("falls back to US providers when MX region is undefined", () => {
    const result = extractWatchProviders(
      response({
        US: { flatrate: [provider({ provider_name: "Amazon Prime", display_priority: 1 })] },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].providerName).toBe("Amazon Prime");
  });

  // ── Both missing ──────────────────────────────────────────────────────────

  it("returns empty array when both MX and US are missing", () => {
    const result = extractWatchProviders(response({}));
    expect(result).toEqual([]);
  });

  it("returns empty array when MX flatrate is empty and US is undefined", () => {
    const result = extractWatchProviders(
      response({ MX: { flatrate: [] } })
    );
    expect(result).toEqual([]);
  });

  // ── Filter null logo_path ─────────────────────────────────────────────────

  it("filters out providers with null logo_path", () => {
    const result = extractWatchProviders(
      response({
        MX: {
          flatrate: [
            provider({ provider_id: 10, logo_path: null, display_priority: 1 }),
            provider({ provider_id: 20, logo_path: "/valid.jpg", display_priority: 2 }),
          ],
        },
      })
    );
    expect(result).toHaveLength(1);
    expect(result[0].providerId).toBe(20);
  });

  // ── Sorting by displayPriority ────────────────────────────────────────────

  it("sorts results by displayPriority ascending", () => {
    const result = extractWatchProviders(
      response({
        MX: {
          flatrate: [
            provider({ provider_name: "Last", display_priority: 50 }),
            provider({ provider_name: "Middle", display_priority: 30 }),
            provider({ provider_name: "First", display_priority: 5 }),
          ],
        },
      })
    );
    const priorities = result.map((p) => p.displayPriority);
    expect(priorities).toEqual([5, 30, 50]);
  });

  // ── logoPath construction ─────────────────────────────────────────────────

  it("constructs logoPath with w45 size from IMG_BASE", () => {
    const result = extractWatchProviders(
      response({
        MX: {
          flatrate: [
            provider({
              provider_name: "Netflix",
              logo_path: "/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg",
              display_priority: 1,
            }),
          ],
        },
      })
    );
    expect(result[0].logoPath).toBe(
      `${IMG_BASE}/w45/t2yyOv40HZeVlLjYsCsPHnWLk4W.jpg`
    );
  });
});
