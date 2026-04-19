import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { isValidFormat, isReservedUsername, normalizeUsername } from "@/lib/validation/username";

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, username } = await req.json();

    if (!name || !email || !password) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    // Validate username if provided
    let normalizedUsername: string | undefined;
    if (username) {
      normalizedUsername = normalizeUsername(username);
      if (!isValidFormat(normalizedUsername) || isReservedUsername(normalizedUsername)) {
        return NextResponse.json({ error: "INVALID_USERNAME_FORMAT" }, { status: 400 });
      }
      // Check uniqueness
      const [existingUsername] = await db
        .select({ id: users.id })
        .from(users)
        .where(sql`LOWER(${users.username}) = LOWER(${normalizedUsername})`)
        .limit(1);
      if (existingUsername) {
        return NextResponse.json({ error: "USERNAME_TAKEN" }, { status: 409 });
      }
    }

    // Check if email already exists
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existing) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const now = new Date();
    const [user] = await db
      .insert(users)
      .values({
        name,
        email,
        passwordHash,
        ...(normalizedUsername ? { username: normalizedUsername, usernameChangedAt: now } : {}),
      })
      .returning({ id: users.id, email: users.email, name: users.name });

    return NextResponse.json({ id: user.id, email: user.email, name: user.name });
  } catch (err) {
    console.error("[register]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
