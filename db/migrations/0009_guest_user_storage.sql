ALTER TABLE "user_identity" DROP CONSTRAINT "user_identity_user_id_user_id_fk";
--> statement-breakpoint
ALTER TABLE "user_session" DROP CONSTRAINT "user_session_identity_fk";
--> statement-breakpoint
ALTER TABLE "user_session" ALTER COLUMN "access_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_session" ALTER COLUMN "id_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_session" ALTER COLUMN "refresh_token" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "user_identity" ADD COLUMN "user_kind" text DEFAULT 'REGISTERED' NOT NULL;--> statement-breakpoint
ALTER TABLE "user_session" ADD COLUMN "user_id" uuid;
--> statement-breakpoint
-- Preserve existing sessions by resolving their current identity to its user.
UPDATE "user_session" AS session
SET "user_id" = identity."user_id"
FROM "user_identity" AS identity
WHERE session."issuer" = identity."issuer" AND session."subject" = identity."subject";
--> statement-breakpoint
ALTER TABLE "user_session" ALTER COLUMN "user_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "kind" text DEFAULT 'REGISTERED' NOT NULL;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "expires_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_id_kind_unique" UNIQUE("id","kind");--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_registered_user_fk" FOREIGN KEY ("user_id","user_kind") REFERENCES "public"."user"("id","kind") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "user_session" DROP COLUMN "issuer";--> statement-breakpoint
ALTER TABLE "user_session" DROP COLUMN "subject";--> statement-breakpoint
ALTER TABLE "user_identity" ADD CONSTRAINT "user_identity_registered_only" CHECK ("user_identity"."user_kind" = 'REGISTERED');--> statement-breakpoint
ALTER TABLE "user" ADD CONSTRAINT "user_kind_valid" CHECK ("user"."kind" in ('REGISTERED', 'GUEST'));