CREATE TABLE "review_comments" (
  "id" text PRIMARY KEY NOT NULL,
  "rating_id" text NOT NULL,
  "user_id" text NOT NULL,
  "parent_id" text,
  "body" text NOT NULL,
  "created_at" timestamp NOT NULL DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_rating_id_ratings_id_fk" FOREIGN KEY ("rating_id") REFERENCES "public"."ratings"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "review_comments" ADD CONSTRAINT "review_comments_parent_id_review_comments_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."review_comments"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "review_comments_rating_id_created_at_idx" ON "review_comments" USING btree ("rating_id","created_at");--> statement-breakpoint
CREATE INDEX "review_comments_parent_id_idx" ON "review_comments" USING btree ("parent_id");
