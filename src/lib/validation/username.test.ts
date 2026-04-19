import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  normalizeUsername,
  isValidFormat,
  isReservedUsername,
  canChangeUsername,
  generateSuggestions,
} from "@/lib/validation/username";

// ─── normalizeUsername ────────────────────────────────────────────────────────

describe("normalizeUsername", () => {
  it("lowercases input", () => {
    expect(normalizeUsername("JohnDoe")).toBe("johndoe");
  });

  it("trims leading and trailing whitespace", () => {
    expect(normalizeUsername("  alice  ")).toBe("alice");
  });

  it("trims and lowercases combined", () => {
    expect(normalizeUsername("  BOB_123  ")).toBe("bob_123");
  });

  it("returns empty string for empty input", () => {
    expect(normalizeUsername("")).toBe("");
  });

  it("handles already-normalized input unchanged", () => {
    expect(normalizeUsername("alice_99")).toBe("alice_99");
  });
});

// ─── isValidFormat ────────────────────────────────────────────────────────────

describe("isValidFormat", () => {
  // Valid cases
  it("accepts a minimal 3-char username", () => {
    expect(isValidFormat("abc")).toBe(true);
  });

  it("accepts a 20-char username", () => {
    expect(isValidFormat("a".repeat(20))).toBe(true);
  });

  it("accepts alphanumeric with underscores in the middle", () => {
    expect(isValidFormat("john_doe_99")).toBe(true);
  });

  // Length failures
  it("rejects a 2-char username (too short)", () => {
    expect(isValidFormat("ab")).toBe(false);
  });

  it("rejects a 21-char username (too long)", () => {
    expect(isValidFormat("a".repeat(21))).toBe(false);
  });

  // Leading/trailing underscore
  it("rejects a username starting with underscore", () => {
    expect(isValidFormat("_alice")).toBe(false);
  });

  it("rejects a username ending with underscore", () => {
    expect(isValidFormat("alice_")).toBe(false);
  });

  // Invalid characters
  it("rejects a username with uppercase letters", () => {
    expect(isValidFormat("Alice")).toBe(false);
  });

  it("rejects a username with a hyphen", () => {
    expect(isValidFormat("john-doe")).toBe(false);
  });

  it("rejects a username with a space", () => {
    expect(isValidFormat("john doe")).toBe(false);
  });

  it("rejects a username with special characters", () => {
    expect(isValidFormat("hello!")).toBe(false);
  });

  it("rejects an empty string", () => {
    expect(isValidFormat("")).toBe(false);
  });
});

// ─── isReservedUsername ───────────────────────────────────────────────────────

describe("isReservedUsername", () => {
  it("returns true for 'admin'", () => {
    expect(isReservedUsername("admin")).toBe(true);
  });

  it("returns true for 'profile'", () => {
    expect(isReservedUsername("profile")).toBe(true);
  });

  it("returns true for 'api'", () => {
    expect(isReservedUsername("api")).toBe(true);
  });

  it("is case-insensitive — 'ADMIN' is reserved", () => {
    expect(isReservedUsername("ADMIN")).toBe(true);
  });

  it("returns false for a regular username", () => {
    expect(isReservedUsername("johndoe")).toBe(false);
  });

  it("returns false for 'john_admin' (not an exact match)", () => {
    expect(isReservedUsername("john_admin")).toBe(false);
  });
});

// ─── canChangeUsername ────────────────────────────────────────────────────────

describe("canChangeUsername", () => {
  it("allows change when lastChangedAt is null (first time)", () => {
    const result = canChangeUsername(null);
    expect(result.allowed).toBe(true);
    expect(result.nextChangeAt).toBeUndefined();
  });

  it("allows change when >30 days have passed", () => {
    const thirtyOneDaysAgo = new Date(Date.now() - 31 * 24 * 60 * 60 * 1000);
    const result = canChangeUsername(thirtyOneDaysAgo);
    expect(result.allowed).toBe(true);
  });

  it("denies change when <30 days have passed", () => {
    const fifteenDaysAgo = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const result = canChangeUsername(fifteenDaysAgo);
    expect(result.allowed).toBe(false);
    expect(result.nextChangeAt).toBeInstanceOf(Date);
  });

  it("nextChangeAt is approximately 30 days after lastChangedAt", () => {
    const lastChanged = new Date(Date.now() - 15 * 24 * 60 * 60 * 1000);
    const result = canChangeUsername(lastChanged);
    const expectedNext = new Date(lastChanged.getTime() + 30 * 24 * 60 * 60 * 1000);
    expect(result.nextChangeAt!.getTime()).toBe(expectedNext.getTime());
  });

  it("allows change when exactly 30 days have passed", () => {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000 - 1);
    const result = canChangeUsername(thirtyDaysAgo);
    expect(result.allowed).toBe(true);
  });
});

// ─── generateSuggestions ─────────────────────────────────────────────────────

describe("generateSuggestions", () => {
  it("returns exactly 5 suggestions", () => {
    const suggestions = generateSuggestions("testuser");
    expect(suggestions).toHaveLength(5);
  });

  it("all suggestions are unique", () => {
    const suggestions = generateSuggestions("testuser");
    const unique = new Set(suggestions);
    expect(unique.size).toBe(5);
  });

  it("all suggestions pass isValidFormat", () => {
    const suggestions = generateSuggestions("testuser");
    for (const s of suggestions) {
      expect(isValidFormat(s)).toBe(true);
    }
  });

  it("suggestions are based on the provided base (starts with base)", () => {
    const suggestions = generateSuggestions("alice");
    for (const s of suggestions) {
      expect(s.startsWith("alice")).toBe(true);
    }
  });

  it("handles a base with invalid characters by stripping them", () => {
    const suggestions = generateSuggestions("test user!");
    expect(suggestions).toHaveLength(5);
    for (const s of suggestions) {
      expect(isValidFormat(s)).toBe(true);
    }
  });

  it("handles empty base by falling back to 'user'", () => {
    const suggestions = generateSuggestions("");
    expect(suggestions).toHaveLength(5);
    for (const s of suggestions) {
      expect(s.startsWith("user")).toBe(true);
    }
  });

  it("each suggestion ends with a 4-digit numeric suffix", () => {
    const suggestions = generateSuggestions("bob");
    for (const s of suggestions) {
      expect(s).toMatch(/\d{4}$/);
    }
  });
});
