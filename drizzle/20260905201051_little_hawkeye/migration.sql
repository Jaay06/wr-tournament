ALTER TABLE "users" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
DROP INDEX "users_email_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" ("email") WHERE "deleted_at" is null;--> statement-breakpoint
DROP INDEX "users_discord_id_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "users_discord_id_unique" ON "users" ("discord_id") WHERE "deleted_at" is null;--> statement-breakpoint
CREATE INDEX "users_deleted_at_idx" ON "users" ("deleted_at");