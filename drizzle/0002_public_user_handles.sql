ALTER TABLE "users" ADD COLUMN "username" varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "username_changed_at" timestamp;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_username_unique" UNIQUE("username");--> statement-breakpoint
CREATE UNIQUE INDEX "idx_users_username_lower" ON "users" (LOWER(username)) WHERE username IS NOT NULL;
