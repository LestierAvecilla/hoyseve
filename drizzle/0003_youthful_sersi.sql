DROP INDEX "idx_users_username_lower";--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "username" SET DATA TYPE varchar(20);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "bio" text;