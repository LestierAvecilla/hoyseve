CREATE TYPE "reaction_type" AS ENUM ('like', 'love', 'surprise', 'angry');--> statement-breakpoint
CREATE TABLE "review_reactions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "rating_id" text NOT NULL,
  "reaction_type" "reaction_type" NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "review_reactions_user_id_rating_id_unique" UNIQUE("user_id","rating_id")
);
--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_reactions" ADD CONSTRAINT "review_reactions_rating_id_ratings_id_fk" FOREIGN KEY ("rating_id") REFERENCES "public"."ratings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_reactions_rating_id_idx" ON "review_reactions" USING btree ("rating_id");
