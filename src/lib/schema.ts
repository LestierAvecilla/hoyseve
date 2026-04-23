import {
  pgTable,
  pgEnum,
  text,
  timestamp,
  integer,
  boolean,
  primaryKey,
  unique,
  index,
  varchar,
} from "drizzle-orm/pg-core";

export const reactionType = pgEnum("reaction_type", ["like", "love", "surprise", "angry"]);

// ─── Auth.js required tables ─────────────────────────────────────────────────

export const users = pgTable("users", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text("name"),
  email: text("email").unique().notNull(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  passwordHash: text("password_hash"), // null for OAuth users
  createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  username: varchar("username", { length: 20 }).unique(), // nullable — gradual migration
  usernameChangedAt: timestamp("username_changed_at", { mode: "date" }),
  bio: text("bio"), // nullable — user bio (max 160 chars enforced at app layer)
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => [
    primaryKey({ columns: [account.provider, account.providerAccountId] }),
  ]
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (vt) => [primaryKey({ columns: [vt.identifier, vt.token] })]
);

// ─── HoySeVe tables ───────────────────────────────────────────────────────────

export const ratings = pgTable(
  "ratings",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    source: text("source", { enum: ["tmdb", "anilist"] }).default("tmdb").notNull(),
    mediaType: text("media_type", { enum: ["movie", "tv", "anime"] }).notNull(),
    score: integer("score").notNull(), // 1-10
    review: text("review"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.source, t.tmdbId, t.mediaType)]
);

export const watchlist = pgTable(
  "watchlist",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    tmdbId: integer("tmdb_id").notNull(),
    source: text("source", { enum: ["tmdb", "anilist"] }).default("tmdb").notNull(),
    mediaType: text("media_type", { enum: ["movie", "tv", "anime"] }).notNull(),
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    watched: boolean("watched").default(false).notNull(),
    addedAt: timestamp("added_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [unique().on(t.userId, t.source, t.tmdbId, t.mediaType)]
);

export const follows = pgTable(
  "follows",
  {
    followerId: text("follower_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    followingId: text("following_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    primaryKey({ columns: [t.followerId, t.followingId] }),
    index("follows_follower_id_idx").on(t.followerId),
    index("follows_following_id_idx").on(t.followingId),
  ]
);

export const activities = pgTable(
  "activities",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    type: text("type", { enum: ["rating", "review", "watchlist_add"] }).notNull(),
    tmdbId: integer("tmdb_id").notNull(),
    source: text("source", { enum: ["tmdb", "anilist"] }).default("tmdb").notNull(),
    mediaType: text("media_type", { enum: ["movie", "tv", "anime"] }).notNull(),
    score: integer("score"), // null for watchlist_add
    review: text("review"), // null unless type=review
    title: text("title").notNull(),
    posterPath: text("poster_path"),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    index("activities_user_id_idx").on(t.userId),
    index("activities_created_at_idx").on(t.createdAt),
    index("activities_user_created_idx").on(t.userId, t.createdAt),
  ]
);

export const reviewReactions = pgTable(
  "review_reactions",
  {
    id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
    ratingId: text("rating_id").notNull().references(() => ratings.id, { onDelete: "cascade" }),
    reactionType: reactionType("reaction_type").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).defaultNow().notNull(),
  },
  (t) => [
    unique().on(t.userId, t.ratingId),
    index("review_reactions_rating_id_idx").on(t.ratingId),
  ]
);

// ─── Types ────────────────────────────────────────────────────────────────────

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type Rating = typeof ratings.$inferSelect;
export type WatchlistItem = typeof watchlist.$inferSelect;
export type Activity = typeof activities.$inferSelect;
export type Follow = typeof follows.$inferSelect;
export type ReviewReaction = typeof reviewReactions.$inferSelect;
export type ReactionTypeValue = "like" | "love" | "surprise" | "angry";
