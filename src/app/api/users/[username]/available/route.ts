import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { sql } from "drizzle-orm";
import { isValidFormat, generateSuggestions, normalizeUsername, isReservedUsername } from "@/lib/validation/username";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ username: string }> }
) {
  const { username } = await params;
  const normalized = normalizeUsername(username);

  if (!isValidFormat(normalized)) {
    return NextResponse.json({ available: false, suggestions: [] });
  }

  if (isReservedUsername(normalized)) {
    return NextResponse.json({ available: false, suggestions: [] });
  }

  const [existing] = await db
    .select({ id: users.id })
    .from(users)
    .where(sql`LOWER(${users.username}) = LOWER(${normalized})`)
    .limit(1);

  if (existing) {
    return NextResponse.json({
      available: false,
      suggestions: generateSuggestions(normalized),
    });
  }

  return NextResponse.json({ available: true, suggestions: [] });
}
