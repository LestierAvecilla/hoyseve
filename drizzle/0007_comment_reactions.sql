CREATE TABLE "comment_reactions" (
  "id" text PRIMARY KEY NOT NULL,
  "user_id" text NOT NULL,
  "comment_id" text NOT NULL,
  "reaction_type" "reaction_type" NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now(),
  CONSTRAINT "comment_reactions_user_id_comment_id_unique" UNIQUE("user_id","comment_id")
);
--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comment_reactions" ADD CONSTRAINT "comment_reactions_comment_id_review_comments_id_fk" FOREIGN KEY ("comment_id") REFERENCES "public"."review_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "comment_reactions_comment_id_idx" ON "comment_reactions" USING btree ("comment_id");
