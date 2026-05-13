import { describe, it, expect } from "vitest";
import { groupNotifications, formatActorNames } from "@/lib/notifications/group";
import type { NotificationTypeValue } from "@/lib/schema";

function makeRow(overrides: Partial<{
  id: string;
  userId: string;
  type: NotificationTypeValue;
  actorId: string | null;
  targetId: string;
  targetType: "review" | "comment";
  groupKey: string;
  read: boolean;
  createdAt: Date;
  actorName: string | null;
  actorImage: string | null;
  targetPreview: string | null;
}> = {}) {
  return {
    id: "notif-1",
    userId: "user-a",
    type: "REACTION_ON_REVIEW" as NotificationTypeValue,
    actorId: "actor-1",
    targetId: "review-1",
    targetType: "review" as const,
    groupKey: "REACTION_ON_REVIEW:review:review-1",
    read: false,
    createdAt: new Date("2026-01-01T12:00:00Z"),
    actorName: "Juan",
    actorImage: null,
    targetPreview: "Mi reseña genial",
    ...overrides,
  };
}

describe("groupNotifications", () => {
  it("groups rows by groupKey", () => {
    const rows = [
      makeRow({ actorId: "actor-1", actorName: "Juan", groupKey: "REACTION_ON_REVIEW:review:r1" }),
      makeRow({ id: "n2", actorId: "actor-2", actorName: "Pedro", groupKey: "REACTION_ON_REVIEW:review:r1" }),
      makeRow({ id: "n3", actorId: "actor-3", actorName: "Ana", groupKey: "REACTION_ON_REVIEW:review:r1" }),
    ];

    const result = groupNotifications(rows);

    expect(result).toHaveLength(1);
    expect(result[0].totalActorCount).toBe(3);
    expect(result[0].actors.map((a) => a.name)).toEqual(["Juan", "Pedro", "Ana"]);
  });

  it("caps actors at 5 per group", () => {
    const rows = Array.from({ length: 8 }, (_, i) =>
      makeRow({
        id: `n${i}`,
        actorId: `actor-${i}`,
        actorName: `User${i}`,
        groupKey: "REACTION_ON_REVIEW:review:r1",
        createdAt: new Date(`2026-01-${String(i + 1).padStart(2, "0")}T12:00:00Z`),
      })
    );

    const result = groupNotifications(rows);

    expect(result).toHaveLength(1);
    expect(result[0].actors).toHaveLength(5);
    expect(result[0].totalActorCount).toBe(8);
  });

  it("sorts groups by latestCreatedAt descending", () => {
    const rows = [
      makeRow({ id: "n1", groupKey: "G2", createdAt: new Date("2026-01-01T12:00:00Z") }),
      makeRow({ id: "n2", groupKey: "G1", createdAt: new Date("2026-01-03T12:00:00Z") }),
      makeRow({ id: "n3", groupKey: "G3", createdAt: new Date("2026-01-02T12:00:00Z") }),
    ];

    const result = groupNotifications(rows);

    expect(result[0].groupKey).toBe("G1");
    expect(result[1].groupKey).toBe("G3");
    expect(result[2].groupKey).toBe("G2");
  });

  it("marks group as read only when ALL rows are read", () => {
    const rows = [
      makeRow({ id: "n1", read: true }),
      makeRow({ id: "n2", read: false }),
    ];

    const result = groupNotifications(rows);

    expect(result[0].read).toBe(false);
  });

  it("marks group as read when every row is read", () => {
    const rows = [
      makeRow({ id: "n1", read: true }),
      makeRow({ id: "n2", read: true }),
    ];

    const result = groupNotifications(rows);

    expect(result[0].read).toBe(true);
  });

  it("uses targetPreviewMap override when provided", () => {
    const rows = [makeRow({ targetPreview: "original" })];
    const previewMap = { "review-1": "overridden" };

    const result = groupNotifications(rows, { targetPreviewMap: previewMap });

    expect(result[0].targetPreview).toBe("overridden");
  });

  it("uses navigateToMap override when provided", () => {
    const rows = [makeRow()];
    const navigateMap = { "review-1": "/anime/123" };

    const result = groupNotifications(rows, { navigateToMap: navigateMap });

    expect(result[0].navigateTo).toBe("/anime/123");
  });

  it("returns empty array for empty input", () => {
    expect(groupNotifications([])).toHaveLength(0);
  });

  it("deduplicates actors within the same group", () => {
    const rows = [
      makeRow({ id: "n1", actorId: "actor-1", groupKey: "G1" }),
      makeRow({ id: "n2", actorId: "actor-1", groupKey: "G1" }),
      makeRow({ id: "n3", actorId: "actor-1", groupKey: "G1" }),
    ];

    const result = groupNotifications(rows);

    expect(result[0].actors).toHaveLength(1);
    expect(result[0].totalActorCount).toBe(1);
  });
});

describe("formatActorNames", () => {
  it("returns single name when only one actor", () => {
    expect(formatActorNames([{ id: "a1", name: "Juan", image: null }], 1)).toBe("Juan");
  });

  it("returns 'Alguien' when actor list is empty", () => {
    expect(formatActorNames([], 0)).toBe("Alguien");
  });

  it("returns two names joined when exactly two actors", () => {
    const actors = [
      { id: "a1", name: "Juan", image: null },
      { id: "a2", name: "Pedro", image: null },
    ];
    expect(formatActorNames(actors, 2)).toBe("Juan, Pedro");
  });

  it("returns 'Juan y 3 más' when 5 total actors but only 2 shown", () => {
    const actors = [
      { id: "a1", name: "Juan", image: null },
      { id: "a2", name: "Pedro", image: null },
    ];
    expect(formatActorNames(actors, 5)).toBe("Juan, Pedro y 3 más");
  });

  it("handles null name by falling back to 'Anónimo'", () => {
    const actors = [{ id: "a1", name: null, image: null }];
    expect(formatActorNames(actors, 1)).toBe("Anónimo");
  });

  it("caps names at 2 when more than 2 actors in total", () => {
    const actors = [
      { id: "a1", name: "Ana", image: null },
      { id: "a2", name: "Juan", image: null },
    ];
    // totalCount=5, but only 2 actors passed — shows first 2 + "+3 más"
    expect(formatActorNames(actors, 5)).toBe("Ana, Juan y 3 más");
  });
});