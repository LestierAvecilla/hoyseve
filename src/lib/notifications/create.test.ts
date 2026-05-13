import { describe, it, expect, vi, beforeEach } from "vitest";
import { createNotification } from "@/lib/notifications/create";
import { notifications } from "@/lib/schema";

// Mock the db module
vi.mock("@/lib/db", () => ({
  db: {
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockResolvedValue(undefined),
  },
}));

import { db } from "@/lib/db";

describe("createNotification", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("skips notification when actorId === recipientId (no self-notification)", async () => {
    await createNotification({
      type: "REACTION_ON_REVIEW",
      actorId: "user-a",
      recipientId: "user-a",
      targetId: "review-1",
      targetType: "review",
    });

    expect(db.insert).not.toHaveBeenCalled();
  });

  it("inserts notification with correct groupKey format REACTION_ON_REVIEW:review:id", async () => {
    await createNotification({
      type: "REACTION_ON_REVIEW",
      actorId: "actor-1",
      recipientId: "user-a",
      targetId: "review-99",
      targetType: "review",
    });

    expect(db.insert).toHaveBeenCalledTimes(1);
    // Insert is called with the notifications table
    expect(db.insert).toHaveBeenCalledWith(notifications);
    // values() is then called on the result
    expect(db.values).toHaveBeenCalledTimes(1);
    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-a",
        type: "REACTION_ON_REVIEW",
        actorId: "actor-1",
        targetId: "review-99",
        targetType: "review",
        groupKey: "REACTION_ON_REVIEW:review:review-99",
      })
    );
  });

  it("inserts notification with MENTION type and comment target", async () => {
    await createNotification({
      type: "MENTION",
      actorId: "actor-1",
      recipientId: "user-a",
      targetId: "comment-5",
      targetType: "comment",
    });

    expect(db.values).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user-a",
        type: "MENTION",
        targetId: "comment-5",
        targetType: "comment",
        groupKey: "MENTION:comment:comment-5",
      })
    );
  });

  it("sets read to false (default) and includes actorId", async () => {
    await createNotification({
      type: "REPLY_ON_COMMENT",
      actorId: "actor-2",
      recipientId: "user-b",
      targetId: "comment-1",
      targetType: "comment",
    });

    const valuesCall = (db.values as ReturnType<typeof vi.fn>).mock.calls[0][0];
    expect(valuesCall.read).toBeUndefined(); // uses default
    expect(valuesCall.actorId).toBe("actor-2");
  });
});