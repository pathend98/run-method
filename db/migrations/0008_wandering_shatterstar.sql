DELETE FROM "user_session";
--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "id_token" text NOT NULL;