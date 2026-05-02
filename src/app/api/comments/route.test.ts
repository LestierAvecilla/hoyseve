import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

// Separate chain mocks for different query paths
const mockSelectReturning = vi.fn();
const mockSelectLimit = vi.fn();
const mockSelectOrderBy = vi.fn();
const mockSelectFromWhere = vi.fn();
const mockInsertReturning = vi.fn();
const mockDeleteWhere = vi.fn();
const mockUpdateWhere = vi.fn();

const mockInnerJoinWhere = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        innerJoin: () => ({
          where: mockInnerJoinWhere,
        }),
        where: mockSelectFromWhere,
      }),
    }),
    insert: () => ({
      values: () => ({
        returning: mockInsertReturning,
      }),
    }),
    delete: () => ({
      where: mockDeleteWhere,
    }),
    update: () => ({
      set: () => ({
        where: mockUpdateWhere,
      }),
    }),
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val })),
  and: vi.fn((...conditions: unknown[]) => conditions),
  asc: vi.fn((col: unknown) => ({ col, direction: "asc" })),
  count: vi.fn(() => "count()" as unknown),
  inArray: vi.fn((col: unknown, vals: unknown[]) => ({ col, vals, _inArray: true })),
}));

vi.mock("@/lib/schema", () => ({
  reviewComments: {
    id: "id",
    ratingId: "ratingId",
    userId: "userId",
    parentId: "parentId",
    body: "body",
    createdAt: "createdAt",
    deletedAt: "deletedAt",
  },
  commentReactions: {
    commentId: "commentId",
    reactionType: "reactionType",
    userId: "userId",
  },
  ratings: {
    id: "id",
  },
  users: {
    id: "id",
    name: "name",
    image: "image",
    username: "username",
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeGetRequest(ratingId: string): NextRequest {
  return new NextRequest(
    `http://localhost/api/comments?ratingId=${encodeURIComponent(ratingId)}`
  );
}

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/comments", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

const COMMENT_WITH_USER = {
  id: "comment-1",
  ratingId: "rating-1",
  userId: "user-123",
  parentId: null,
  body: "Qué buena reseña",
  createdAt: new Date("2026-05-01"),
  userName: "Alice",
  userImage: null,
  userHandle: "alice",
};

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated
  mockAuth.mockResolvedValue({ user: { id: "user-123" } });

  // Default GET: innerJoin → where → orderBy returns comments
  mockSelectOrderBy.mockReturnValue([COMMENT_WITH_USER]);
  mockInnerJoinWhere.mockReturnValue({ orderBy: mockSelectOrderBy });

  // Default reaction enrichment: returns empty arrays (no reactions)
  mockSelectFromWhere.mockReturnValue([]);

  // Default POST: rating check (from → where → limit)
  mockSelectLimit.mockReturnValue([{ id: "rating-1" }]);
  mockSelectFromWhere.mockReturnValue({ limit: mockSelectLimit });

  // Default POST: insert → values → returning
  mockInsertReturning.mockResolvedValue([{ id: "comment-1" }]);

  // Default DELETE
  mockDeleteWhere.mockReturnValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("GET /api/comments", () => {
  it("returns 400 when ratingId is missing", async () => {
    const { GET } = await import("./route");
    const req = new NextRequest("http://localhost/api/comments");
    const res = await GET(req);
    expect(res.status).toBe(400);
  });

  it("returns comments array when ratingId is valid", async () => {
    // Override select().from().where() for enrichment queries
    mockSelectFromWhere.mockReturnValue([]);

    const { GET } = await import("./route");
    const req = makeGetRequest("rating-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.comments).toBeDefined();
    expect(Array.isArray(json.comments)).toBe(true);
  });

  it("returns empty reactionSummary and null userReaction when no reactions exist", async () => {
    // Guest user — no user reaction query runs
    mockAuth.mockResolvedValue(null);
    // No reaction rows for summary query
    mockSelectFromWhere.mockReturnValueOnce([]);

    const { GET } = await import("./route");
    const req = makeGetRequest("rating-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    const comment = json.comments[0];
    expect(comment.reactionSummary).toEqual({});
    expect(comment.userReaction).toBeNull();
  });

  it("returns populated reactionSummary and null userReaction for guest when reactions exist", async () => {
    // Guest user — only summary query runs, user reaction query is skipped
    mockAuth.mockResolvedValue(null);
    // Summary query returns two hype reactions on comment-1
    mockSelectFromWhere.mockReturnValueOnce([
      { commentId: "comment-1", reactionType: "hype" },
      { commentId: "comment-1", reactionType: "hype" },
    ]);

    const { GET } = await import("./route");
    const req = makeGetRequest("rating-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    const comment = json.comments[0];
    expect(comment.reactionSummary).toEqual({ hype: 2 });
    expect(comment.userReaction).toBeNull();
  });

  it("returns userReaction matching the authenticated user's reaction", async () => {
    // Authenticated user who has reacted with "hype"
    mockAuth.mockResolvedValue({ user: { id: "user-123" } });
    // Call #1: summary query — 3 hype reactions
    // Call #2: user reaction query — current user reacted with hype
    mockSelectFromWhere
      .mockReturnValueOnce([
        { commentId: "comment-1", reactionType: "hype" },
        { commentId: "comment-1", reactionType: "hype" },
        { commentId: "comment-1", reactionType: "hype" },
      ])
      .mockReturnValueOnce([
        { commentId: "comment-1", reactionType: "hype" },
      ]);

    const { GET } = await import("./route");
    const req = makeGetRequest("rating-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    const comment = json.comments[0];
    expect(comment.reactionSummary).toEqual({ hype: 3 });
    expect(comment.userReaction).toBe("hype");
  });

  it("returns null userReaction for auth user on comments they haven't reacted to", async () => {
    // Authenticated user who has NOT reacted on this comment
    mockAuth.mockResolvedValue({ user: { id: "user-456" } });
    // Call #1: summary — other users' reactions
    // Call #2: user reaction query — no rows for user-456
    mockSelectFromWhere
      .mockReturnValueOnce([
        { commentId: "comment-1", reactionType: "sadness" },
      ])
      .mockReturnValueOnce([]);

    const { GET } = await import("./route");
    const req = makeGetRequest("rating-1");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();

    const comment = json.comments[0];
    expect(comment.reactionSummary).toEqual({ sadness: 1 });
    expect(comment.userReaction).toBeNull();
  });
});

describe("POST /api/comments", () => {
  describe("auth", () => {
    it("returns 401 when no session", async () => {
      mockAuth.mockResolvedValue(null);
      const { POST } = await import("./route");
      const req = makePostRequest({ ratingId: "rating-1", body: "Hola" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });
      const { POST } = await import("./route");
      const req = makePostRequest({ ratingId: "rating-1", body: "Hola" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 when body is missing", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ ratingId: "rating-1" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when body is empty after trim", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ ratingId: "rating-1", body: "   " });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when body exceeds 1000 chars", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({
        ratingId: "rating-1",
        body: "a".repeat(1001),
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when ratingId is missing", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ body: "Hola" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when rating is not found", async () => {
      mockSelectLimit.mockResolvedValueOnce([]); // rating not found

      const { POST } = await import("./route");
      const req = makePostRequest({ ratingId: "nonexistent", body: "Hola" });
      const res = await POST(req);
      expect(res.status).toBe(404);
    });
  });

  describe("parentId validation", () => {
    it("returns 400 when parentId does not exist", async () => {
      // First select: rating check (passes)
      mockSelectLimit.mockResolvedValueOnce([{ id: "rating-1" }]);
      // Second select: parent check (fails — no rows)
      mockSelectLimit.mockResolvedValueOnce([]);

      const { POST } = await import("./route");
      const req = makePostRequest({
        ratingId: "rating-1",
        body: "Respuesta",
        parentId: "nonexistent",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when parentId belongs to different rating", async () => {
      // First select: rating check (passes)
      mockSelectLimit.mockResolvedValueOnce([{ id: "rating-1" }]);
      // Second select: parent check (found but different rating)
      mockSelectLimit.mockResolvedValueOnce([
        { id: "parent-1", ratingId: "rating-2" },
      ]);

      const { POST } = await import("./route");
      const req = makePostRequest({
        ratingId: "rating-1",
        body: "Respuesta",
        parentId: "parent-1",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });
  });

  describe("happy path", () => {
    it("returns 201 on valid top-level comment", async () => {
      // Rating check passes
      mockSelectLimit.mockResolvedValueOnce([{ id: "rating-1" }]);
      // Insert returns the comment
      mockInsertReturning.mockResolvedValueOnce([{ id: "comment-new" }]);
      // Re-select with innerJoin returns full comment with user
      mockSelectLimit.mockResolvedValueOnce([COMMENT_WITH_USER]);
      // Re-select goes through innerJoin (since we're selecting from reviewComments + users)
      mockInnerJoinWhere.mockReturnValue({ limit: mockSelectLimit });

      const { POST } = await import("./route");
      const req = makePostRequest({
        ratingId: "rating-1",
        body: "Gran reseña",
      });
      const res = await POST(req);
      expect(res.status).toBe(201);
    });
  });
});

describe("DELETE /api/comments", () => {
  describe("auth", () => {
    it("returns 401 when no session", async () => {
      mockAuth.mockResolvedValue(null);
      const { DELETE } = await import("./route");
      const req = makeDeleteRequest({ id: "comment-1" });
      const res = await DELETE(req);
      expect(res.status).toBe(401);
    });
  });

  describe("authorization", () => {
    it("returns 403 when user is not the comment owner", async () => {
      mockSelectLimit.mockResolvedValueOnce([{ userId: "other-user" }]);

      const { DELETE } = await import("./route");
      const req = makeDeleteRequest({ id: "comment-1" });
      const res = await DELETE(req);
      expect(res.status).toBe(403);
    });

    it("returns 404 when comment does not exist", async () => {
      mockSelectLimit.mockResolvedValueOnce([]);

      const { DELETE } = await import("./route");
      const req = makeDeleteRequest({ id: "nonexistent" });
      const res = await DELETE(req);
      expect(res.status).toBe(404);
    });
  });

  describe("happy path", () => {
    it("returns 200 when owner deletes own comment", async () => {
      mockSelectLimit.mockResolvedValueOnce([{ userId: "user-123" }]);

      const { DELETE } = await import("./route");
      const req = makeDeleteRequest({ id: "comment-1" });
      const res = await DELETE(req);
      expect(res.status).toBe(200);
    });
  });
});
