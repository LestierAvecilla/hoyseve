// ─── Username validation helpers ─────────────────────────────────────────────
// Centralized logic for username formatting, validation, cooldowns, and suggestions.

const USERNAME_MIN_LENGTH = 3;
const USERNAME_MAX_LENGTH = 20;
const USERNAME_CHANGE_COOLDOWN_DAYS = 30;

const RESERVED_USERNAMES = new Set([
  "admin",
  "root",
  "api",
  "auth",
  "login",
  "logout",
  "register",
  "signup",
  "signin",
  "signout",
  "me",
  "user",
  "users",
  "account",
  "accounts",
  "profile",
  "profiles",
  "settings",
  "config",
  "system",
  "support",
  "help",
  "about",
  "contact",
  "terms",
  "privacy",
  "static",
  "assets",
  "public",
  "null",
  "undefined",
  "true",
  "false",
]);

/**
 * Normalizes a username candidate: lowercase and trim whitespace.
 */
export function normalizeUsername(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Validates the format of a (pre-normalized) username.
 * Rules:
 * - 3 to 20 characters
 * - Only alphanumeric characters and underscores
 * - No leading or trailing underscore
 */
export function isValidFormat(username: string): boolean {
  if (username.length < USERNAME_MIN_LENGTH || username.length > USERNAME_MAX_LENGTH) {
    return false;
  }
  // No leading or trailing underscore
  if (username.startsWith("_") || username.endsWith("_")) {
    return false;
  }
  // Only alphanumeric + underscore
  return /^[a-z0-9_]+$/.test(username);
}

/**
 * Checks whether a username is in the reserved block list.
 * Expects a pre-normalized (lowercase) username.
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}

export interface CanChangeUsernameResult {
  allowed: boolean;
  nextChangeAt?: Date;
}

/**
 * Enforces a 30-day cooldown between username changes.
 * Pass `null` if the user has never changed their username.
 */
export function canChangeUsername(lastChangedAt: Date | null): CanChangeUsernameResult {
  if (lastChangedAt === null) {
    return { allowed: true };
  }

  const cooldownMs = USERNAME_CHANGE_COOLDOWN_DAYS * 24 * 60 * 60 * 1000;
  const nextChangeAt = new Date(lastChangedAt.getTime() + cooldownMs);
  const now = new Date();

  if (now >= nextChangeAt) {
    return { allowed: true };
  }

  return { allowed: false, nextChangeAt };
}

/**
 * Generates up to 5 username suggestions from a base string.
 * Appends random numeric suffixes to the normalized base (truncated to fit the
 * 20-char limit) to create unique candidates.
 */
export function generateSuggestions(base: string): string[] {
  const normalized = normalizeUsername(base).replace(/[^a-z0-9_]/g, "");
  // Trim to leave room for the 4-digit suffix (_NNN or NN)
  const maxBaseLength = USERNAME_MAX_LENGTH - 4;
  const safeBase = normalized.slice(0, maxBaseLength) || "user";

  const suggestions = new Set<string>();

  while (suggestions.size < 5) {
    const suffix = Math.floor(Math.random() * 9000 + 1000); // 1000–9999
    const candidate = `${safeBase}${suffix}`;
    if (isValidFormat(candidate) && !isReservedUsername(candidate)) {
      suggestions.add(candidate);
    }
  }

  return Array.from(suggestions);
}
