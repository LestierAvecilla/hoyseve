import { db } from "@/lib/db";
import { notifications } from "@/lib/schema";
import type { NotificationTypeValue } from "@/lib/schema";

interface CreateNotificationInput {
  type: NotificationTypeValue;
  actorId: string;
  recipientId: string;
  targetId: string;
  targetType: "review" | "comment";
}

/**
 * Inserts a notification row. Skips silently if actorId === recipientId
 * (no self-notifications). Computes groupKey as `{type}:{targetType}:{targetId}`.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<void> {
  if (input.actorId === input.recipientId) return;

  const groupKey = `${input.type}:${input.targetType}:${input.targetId}`;

  await db.insert(notifications).values({
    userId: input.recipientId,
    type: input.type,
    actorId: input.actorId,
    targetId: input.targetId,
    targetType: input.targetType,
    groupKey,
  });
}
