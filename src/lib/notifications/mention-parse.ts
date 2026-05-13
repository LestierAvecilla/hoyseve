import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { inArray } from "drizzle-orm";

const MENTION_REGEX = /\B@([a-zA-Z0-9_]{3,20})/g;

/**
 * Parses @username mentions from text, resolves them against the users table,
 * and returns user IDs. Excludes actorId (self-mention) and non-existent handles.
 */
export async function parseMentions(
  text: string,
  actorId: string
): Promise<string[]> {
  const matches = text.matchAll(MENTION_REGEX);
  const handles = new Set<string>();

  for (const match of matches) {
    handles.add(match[1].toLowerCase());
  }

  if (handles.size === 0) return [];

  // Batch-resolve handles against the users table
  const handleList = Array.from(handles);
  const resolvedRows = await db
    .select({ id: users.id, username: users.username })
    .from(users)
    .where(inArray(users.username, handleList));

  // Build a lookup map
  const handleToId = new Map<string, string>();
  for (const row of resolvedRows) {
    if (row.username) {
      handleToId.set(row.username.toLowerCase(), row.id);
    }
  }

  // Resolve matched handles to IDs, excluding self and unknown
  const result: string[] = [];
  for (const handle of handleList) {
    const id = handleToId.get(handle);
    if (id && id !== actorId) {
      result.push(id);
    }
  }

  return result;
}
