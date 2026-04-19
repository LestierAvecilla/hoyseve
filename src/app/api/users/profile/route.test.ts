import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

// Mock auth module — default: authenticated user
const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// Mock canChangeUsername — default: change allowed
const mockCanChangeUsername = vi.fn();
vi.mock("@/lib/validation/username", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/validation/username")>();
  return {
    ...actual,
    canChangeUsername: (...args: unknown[]) => mockCanChangeUsername(...args),
  };
});

// Drizzle chain mocks
const mockReturning = vi.fn();
const mockWhere = vi.fn();
const mockSet = vi.fn();
const mockUpdate = vi.fn();
const mockLimit = vi.fn();
const mockFrom = vi.fn();
const mockSelect = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: (...args: unknown[]) => mockSelect(...args),
    update: (...args: unknown[]) => mockUpdate(...args),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col, val) => ({ col, val })),
  sql: vi.fn((strings: TemplateStringsArray, ...values: unknown[]) => ({ strings, values })),
}));

vi.mock("@/lib/schema", () => ({
  users: {
    id: "id",
    name: "name",
    username: "username",
    bio: "bio",
    image: "image",
    usernameChangedAt: "usernameChangedAt",
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/users/profile", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const VALID_PAYLOAD = {
  name: "Alice Doe",
  username: "alicedoe",
  bio: "Hola, soy Alice",
  avatarUrl: null,
};

const UPDATED_USER = {
  name: "Alice Doe",
  username: "alicedoe",
  bio: "Hola, soy Alice",
  image: null,
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated
  mockAuth.mockResolvedValue({ user: { id: "user-123" } });

  // Default: change allowed
  mockCanChangeUsername.mockReturnValue({ allowed: true });

  // Default: db.select for currentUser
  mockLimit.mockResolvedValue([{ username: "alicedoe", usernameChangedAt: null }]);
  mockWhere.mockReturnValue({ limit: mockLimit });
  mockFrom.mockReturnValue({ where: mockWhere });
  mockSelect.mockReturnValue({ from: mockFrom });

  // Default: db.update chain
  mockReturning.mockResolvedValue([UPDATED_USER]);
  mockWhere.mockReturnValue({ limit: mockLimit, returning: mockReturning });
  mockSet.mockReturnValue({ where: mockWhere });
  mockUpdate.mockReturnValue({ set: mockSet });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("PUT /api/users/profile", () => {
  describe("happy path", () => {
    it("returns 200 with updated user on valid payload", async () => {
      const { PUT } = await import("./route");
      const req = makeRequest(VALID_PAYLOAD);
      const res = await PUT(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.user).toMatchObject({ name: "Alice Doe", username: "alicedoe" });
    });
  });

  describe("auth", () => {
    it("returns 401 when no session", async () => {
      mockAuth.mockResolvedValue(null);
      const { PUT } = await import("./route");
      const req = makeRequest(VALID_PAYLOAD);
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });
      const { PUT } = await import("./route");
      const req = makeRequest(VALID_PAYLOAD);
      const res = await PUT(req);
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 when bio exceeds 160 characters", async () => {
      const { PUT } = await import("./route");
      const req = makeRequest({ ...VALID_PAYLOAD, bio: "a".repeat(161) });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when name is empty", async () => {
      const { PUT } = await import("./route");
      const req = makeRequest({ ...VALID_PAYLOAD, name: "" });
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });

    it("returns 400 when username is invalid format", async () => {
      const { PUT } = await import("./route");
      const req = makeRequest({ ...VALID_PAYLOAD, username: "ab" }); // too short
      const res = await PUT(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error.code).toBe("VALIDATION_ERROR");
    });
  });

  describe("username taken", () => {
    it("returns 409 when username is taken by another user", async () => {
      // currentUser has a different username → changing it
      mockLimit
        .mockResolvedValueOnce([{ username: "oldusername", usernameChangedAt: null }]) // first select (currentUser)
        .mockResolvedValueOnce([{ id: "other-user-456" }]); // second select (uniqueness check)

      const { PUT } = await import("./route");
      const req = makeRequest(VALID_PAYLOAD);
      const res = await PUT(req);
      expect(res.status).toBe(409);
      const json = await res.json();
      expect(json.error.code).toBe("TAKEN");
    });
  });
});
