import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/schema";
import { eq, sql } from "drizzle-orm";
import { profileUpdateSchema } from "@/lib/validation/profile";
import { canChangeUsername } from "@/lib/validation/username";

export async function PUT(req: NextRequest) {
  // ── Auth guard ──
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const userId = session.user.id;

  // ── Parse body ──
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  // ── Zod validation ──
  const parsed = profileUpdateSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues[0];
    return NextResponse.json(
      {
        error: {
          code: "VALIDATION_ERROR",
          message: firstIssue.message,
          field: firstIssue.path[0] as string,
        },
      },
      { status: 400 }
    );
  }
  const { name, username, bio, avatarUrl } = parsed.data;

  // ── Fetch current user state ──
  const [currentUser] = await db
    .select({
      username: users.username,
      usernameChangedAt: users.usernameChangedAt,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!currentUser) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const isChangingUsername = username !== currentUser.username;

  // ── Cooldown check (only when username is being changed) ──
  if (isChangingUsername) {
    const cooldown = canChangeUsername(currentUser.usernameChangedAt ?? null);
    if (!cooldown.allowed) {
      const nextDate = cooldown.nextChangeAt
        ? cooldown.nextChangeAt.toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric",
          })
        : null;
      return NextResponse.json(
        {
          error: {
            code: "TOO_RECENTLY_CHANGED",
            message: `Podés cambiar tu username cada 30 días. Próximo cambio: ${nextDate}`,
            nextChangeAt: cooldown.nextChangeAt?.toISOString() ?? null,
          },
        },
        { status: 400 }
      );
    }

    // ── Uniqueness check ──
    const [existing] = await db
      .select({ id: users.id })
      .from(users)
      .where(sql`LOWER(${users.username}) = LOWER(${username})`)
      .limit(1);

    if (existing && existing.id !== userId) {
      return NextResponse.json(
        { error: { code: "TAKEN", message: "Ese username ya está en uso" } },
        { status: 409 }
      );
    }
  }

  // ── Atomic DB update ──
  const now = new Date();
  const [updated] = await db
    .update(users)
    .set({
      name,
      username,
      bio: bio ?? null,
      image: avatarUrl ?? undefined,
      ...(isChangingUsername ? { usernameChangedAt: now } : {}),
    })
    .where(eq(users.id, userId))
    .returning({
      name: users.name,
      username: users.username,
      bio: users.bio,
      image: users.image,
    });

  return NextResponse.json({ user: updated }, { status: 200 });
}
