import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// ─── Mocks ────────────────────────────────────────────────────────────────────

const mockAuth = vi.fn();
vi.mock("@/auth", () => ({
  auth: () => mockAuth(),
}));

const mockSelectLimit = vi.fn();
const mockSelectWhereResult = vi.fn();
const mockDeleteWhere = vi.fn();
const mockUpdateSetWhere = vi.fn();
const mockQueryFindFirst = vi.fn();

vi.mock("@/lib/db", () => ({
  db: {
    select: () => ({
      from: () => ({
        where: () => mockSelectWhereResult(),
      }),
    }),
    insert: () => ({
      values: () => ({}),
    }),
    update: () => ({
      set: () => ({
        where: mockUpdateSetWhere,
      }),
    }),
    delete: () => ({
      where: mockDeleteWhere,
    }),
    query: {
      commentReactions: {
        findFirst: mockQueryFindFirst,
      },
    },
  },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((col: unknown, val: unknown) => ({ col, val, _eq: true })),
  and: vi.fn((...conditions: unknown[]) => conditions),
}));

vi.mock("@/lib/schema", () => ({
  commentReactions: {
    id: "id",
    userId: "userId",
    commentId: "commentId",
    reactionType: "reactionType",
    createdAt: "createdAt",
  },
  reviewComments: {
    id: "id",
  },
}));

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makePostRequest(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/comment-reactions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  vi.clearAllMocks();

  // Default: authenticated
  mockAuth.mockResolvedValue({ user: { id: "user-123" } });

  // Default: comment exists
  mockSelectLimit.mockResolvedValue([{ id: "comment-1" }]);
  // Default: select().from().where() returns object with .limit() (comment check)
  mockSelectWhereResult.mockReturnValue({ limit: mockSelectLimit });

  // Default: no existing reaction
  mockQueryFindFirst.mockResolvedValue(null);

  // Default: delete/update succeed
  mockDeleteWhere.mockResolvedValue(undefined);
  mockUpdateSetWhere.mockResolvedValue(undefined);
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe("POST /api/comment-reactions", () => {
  describe("auth", () => {
    it("returns 401 when no session", async () => {
      mockAuth.mockResolvedValue(null);
      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });

    it("returns 401 when session has no user id", async () => {
      mockAuth.mockResolvedValue({ user: {} });
      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(401);
    });
  });

  describe("validation", () => {
    it("returns 400 when body is invalid JSON", async () => {
      const { POST } = await import("./route");
      const req = new NextRequest("http://localhost/api/comment-reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not-json",
      });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when commentId is missing", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when type is missing", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 400 when type is invalid", async () => {
      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "invalid" });
      const res = await POST(req);
      expect(res.status).toBe(400);
    });

    it("returns 404 when comment does not exist", async () => {
      mockSelectLimit.mockResolvedValueOnce([]); // comment not found

      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "nonexistent", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toBe("Comment not found");
    });
  });

  describe("toggle logic", () => {
    it("inserts when no existing reaction", async () => {
      // First findFirst: no existing reaction (toggle check)
      // Second findFirst: post-insert user reaction
      mockQueryFindFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce({ reactionType: "hype" });
      // Comment exists check (select + limit)
      mockSelectLimit.mockResolvedValueOnce([{ id: "comment-1" }]);
      // Summary query: select().from().where() returns array directly
      mockSelectWhereResult.mockReturnValueOnce({ limit: mockSelectLimit });
      mockSelectWhereResult.mockReturnValueOnce([{ reactionType: "hype" }]);

      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.userReaction).toBe("hype");
    });

    it("deletes when same type exists (toggle off)", async () => {
      // First findFirst: existing same type → delete
      // Second findFirst: post-delete check → null
      mockQueryFindFirst
        .mockResolvedValueOnce({ id: "cr-1", reactionType: "hype" })
        .mockResolvedValueOnce(null);
      // Comment exists
      mockSelectLimit.mockResolvedValueOnce([{ id: "comment-1" }]);
      // Summary: empty after delete
      mockSelectWhereResult.mockReturnValueOnce({ limit: mockSelectLimit });
      mockSelectWhereResult.mockReturnValueOnce([]);

      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.userReaction).toBeNull();
    });

    it("updates when different type exists (switch)", async () => {
      // First findFirst: existing diff type → update
      // Second findFirst: post-update check → new type
      mockQueryFindFirst
        .mockResolvedValueOnce({ id: "cr-1", reactionType: "sadness" })
        .mockResolvedValueOnce({ reactionType: "hype" });
      // Comment exists
      mockSelectLimit.mockResolvedValueOnce([{ id: "comment-1" }]);
      // Summary after switch
      mockSelectWhereResult.mockReturnValueOnce({ limit: mockSelectLimit });
      mockSelectWhereResult.mockReturnValueOnce([{ reactionType: "hype" }]);

      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.userReaction).toBe("hype");
    });
  });

  describe("summary response", () => {
    it("returns accurate summary after toggle", async () => {
      mockQueryFindFirst
        .mockResolvedValueOnce(null) // no existing
        .mockResolvedValueOnce({ reactionType: "hype" }); // post-insert
      // Comment exists
      mockSelectLimit.mockResolvedValueOnce([{ id: "comment-1" }]);
      // Summary
      mockSelectWhereResult.mockReturnValueOnce({ limit: mockSelectLimit });
      mockSelectWhereResult.mockReturnValueOnce([
        { reactionType: "hype" },
        { reactionType: "hype" },
        { reactionType: "sadness" },
      ]);

      const { POST } = await import("./route");
      const req = makePostRequest({ commentId: "comment-1", type: "hype" });
      const res = await POST(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.summary).toEqual({ hype: 2, sadness: 1 });
    });
  });
});
