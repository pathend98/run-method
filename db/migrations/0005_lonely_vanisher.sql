CREATE TABLE "user_session" (
	"session_key_hash" text PRIMARY KEY NOT NULL,
	"issuer" text NOT NULL,
	"subject" text NOT NULL,
	"access_token" text NOT NULL,
	"refresh_token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "user_session" ADD CONSTRAINT "user_session_identity_fk" FOREIGN KEY ("issuer","subject") REFERENCES "public"."user_identity"("issuer","subject") ON DELETE cascade ON UPDATE no action;