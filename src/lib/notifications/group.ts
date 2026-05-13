import type { Notification, NotificationTypeValue } from "@/lib/schema";

export interface GroupedActor {
  id: string;
  name: string | null;
  image: string | null;
}

export interface NotificationGroup {
  groupKey: string;
  type: NotificationTypeValue;
  targetType: "review" | "comment";
  targetId: string;
  targetPreview: string | null;
  actors: GroupedActor[];
  totalActorCount: number;
  latestCreatedAt: string;
  read: boolean;
  navigateTo: string | null;
}

interface RawNotification {
  id: string;
  userId: string;
  type: NotificationTypeValue;
  actorId: string | null;
  targetId: string;
  targetType: "review" | "comment";
  groupKey: string;
  read: boolean;
  createdAt: Date;
  // joined actor fields
  actorName: string | null;
  actorImage: string | null;
  // joined target preview
  targetPreview: string | null;
}

/**
 * Groups notification rows by groupKey. Capped at 5 actors per group.
 * Sorted by latest notification in each group (descending).
 */
export function groupNotifications(
  rows: RawNotification[],
  opts?: { targetPreviewMap?: Record<string, string | null>; navigateToMap?: Record<string, string | null> }
): NotificationGroup[] {
  const groups = new Map<string, {
    groupKey: string;
    type: NotificationTypeValue;
    targetType: "review" | "comment";
    targetId: string;
    targetPreview: string | null;
    navigateTo: string | null;
    actors: Map<string, GroupedActor>;
    latestCreatedAt: Date;
    allRead: boolean;
  }>();

  for (const row of rows) {
    const existing = groups.get(row.groupKey);

    if (existing) {
      // Add actor if not already in the map
      if (row.actorId && !existing.actors.has(row.actorId)) {
        existing.actors.set(row.actorId, {
          id: row.actorId,
          name: row.actorName,
          image: row.actorImage,
        });
      }
      // Track latest timestamp
      if (row.createdAt > existing.latestCreatedAt) {
        existing.latestCreatedAt = row.createdAt;
      }
      // All read only if ALL rows in group are read
      if (!row.read) existing.allRead = false;
    } else {
      const targetPreview =
        opts?.targetPreviewMap?.[row.targetId] ?? row.targetPreview ?? null;

      const navigateTo =
        opts?.navigateToMap?.[row.targetId] ?? null;

      const actorMap = new Map<string, GroupedActor>();
      if (row.actorId) {
        actorMap.set(row.actorId, {
          id: row.actorId,
          name: row.actorName,
          image: row.actorImage,
        });
      }

      groups.set(row.groupKey, {
        groupKey: row.groupKey,
        type: row.type,
        targetType: row.targetType,
        targetId: row.targetId,
        targetPreview,
        navigateTo,
        actors: actorMap,
        latestCreatedAt: row.createdAt,
        allRead: row.read,
      });
    }
  }

  // Convert map to array, cap actors at 5, sort by latest
  const result: NotificationGroup[] = [];
  for (const [, g] of groups) {
    const actorsArr = Array.from(g.actors.values()).slice(0, 5);
    result.push({
      groupKey: g.groupKey,
      type: g.type,
      targetType: g.targetType,
      targetId: g.targetId,
      targetPreview: g.targetPreview,
      navigateTo: g.navigateTo,
      actors: actorsArr,
      totalActorCount: g.actors.size,
      latestCreatedAt: g.latestCreatedAt.toISOString(),
      read: g.allRead,
    });
  }

  result.sort(
    (a, b) =>
      new Date(b.latestCreatedAt).getTime() -
      new Date(a.latestCreatedAt).getTime()
  );

  return result;
}

/**
 * Builds a human-readable actor string for a notification group.
 * Examples:
 *   - "Juan reaccionó a tu reseña" (1 actor)
 *   - "Juan, Pedro y 3 más reaccionaron a tu reseña" (5 actors, 8 total)
 */
export function formatActorNames(
  actors: GroupedActor[],
  totalCount: number
): string {
  const names = actors.map((a) => a.name ?? "Anónimo");
  const others = totalCount - actors.length;

  if (names.length === 0) return "Alguien";
  if (names.length === 1 && others === 0) return names[0];

  const joined = names.slice(0, 2).join(", ");
  if (others > 0) {
    return `${joined} y ${others} más`;
  }
  return joined;
}
