CREATE TYPE "public"."account_role" AS ENUM('user', 'organizer');--> statement-breakpoint
CREATE TYPE "public"."lineup_position" AS ENUM('starter', 'substitute');--> statement-breakpoint
CREATE TYPE "public"."notification_status" AS ENUM('unread', 'read');--> statement-breakpoint
CREATE TYPE "public"."request_status" AS ENUM('pending', 'accepted', 'declined', 'revoked');--> statement-breakpoint
CREATE TYPE "public"."team_status" AS ENUM('draft', 'submitted');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('T1', 'T2', 'T3', 'T4');--> statement-breakpoint
CREATE TYPE "public"."tier_status" AS ENUM('pending', 'approved');--> statement-breakpoint
CREATE TYPE "public"."wild_rift_role" AS ENUM('Baron', 'Jungle', 'Mid', 'Dragon', 'Support');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"type" text NOT NULL,
	"message" text NOT NULL,
	"status" "notification_status" DEFAULT 'unread' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"read_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "password_reset_tokens" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"token_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "player_registrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"participant_id" uuid NOT NULL,
	"riot_name" text NOT NULL,
	"riot_tag" text NOT NULL,
	"current_rank" text NOT NULL,
	"self_assessed_tier" "tier" NOT NULL,
	"approved_tier" "tier",
	"tier_status" "tier_status" DEFAULT 'pending' NOT NULL,
	"primary_role" "wild_rift_role" NOT NULL,
	"secondary_role" "wild_rift_role" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "player_registrations_tier_status_check" CHECK (("player_registrations"."tier_status" = 'pending' and "player_registrations"."approved_tier" is null) or ("player_registrations"."tier_status" = 'approved' and "player_registrations"."approved_tier" is not null)),
	CONSTRAINT "player_registrations_distinct_roles_check" CHECK ("player_registrations"."primary_role" <> "player_registrations"."secondary_role")
);
--> statement-breakpoint
CREATE TABLE "team_invites" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"invited_registration_id" uuid NOT NULL,
	"invited_by_registration_id" uuid NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_join_requests" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"status" "request_status" DEFAULT 'pending' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"responded_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "team_members" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"team_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"is_captain" boolean DEFAULT false NOT NULL,
	"lineup_position" "lineup_position" NOT NULL,
	"starter_role" "wild_rift_role",
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "team_members_lineup_role_check" CHECK (("team_members"."lineup_position" = 'starter' and "team_members"."starter_role" is not null) or ("team_members"."lineup_position" = 'substitute' and "team_members"."starter_role" is null))
);
--> statement-breakpoint
CREATE TABLE "teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"status" "team_status" DEFAULT 'draft' NOT NULL,
	"submitted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_participants" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"joined_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tournament_settings" (
	"id" integer PRIMARY KEY DEFAULT 1 NOT NULL,
	"name" text NOT NULL,
	"region" text NOT NULL,
	"invite_code_hash" text NOT NULL,
	"invite_enabled" boolean DEFAULT true NOT NULL,
	"registration_deadline" timestamp with time zone NOT NULL,
	"updated_by" uuid NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "tournament_settings_singleton_check" CHECK ("tournament_settings"."id" = 1)
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text,
	"discord_id" text,
	"password_hash" text,
	"display_name" text NOT NULL,
	"avatar_url" text,
	"role" "account_role" DEFAULT 'user' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "users_identity_check" CHECK ("users"."email" is not null or "users"."discord_id" is not null)
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "player_registrations" ADD CONSTRAINT "player_registrations_participant_id_tournament_participants_id_fk" FOREIGN KEY ("participant_id") REFERENCES "public"."tournament_participants"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_registration_id_player_registrations_id_fk" FOREIGN KEY ("invited_registration_id") REFERENCES "public"."player_registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_invites" ADD CONSTRAINT "team_invites_invited_by_registration_id_player_registrations_id_fk" FOREIGN KEY ("invited_by_registration_id") REFERENCES "public"."player_registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_join_requests" ADD CONSTRAINT "team_join_requests_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_join_requests" ADD CONSTRAINT "team_join_requests_registration_id_player_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."player_registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_team_id_teams_id_fk" FOREIGN KEY ("team_id") REFERENCES "public"."teams"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "team_members" ADD CONSTRAINT "team_members_registration_id_player_registrations_id_fk" FOREIGN KEY ("registration_id") REFERENCES "public"."player_registrations"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_participants" ADD CONSTRAINT "tournament_participants_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tournament_settings" ADD CONSTRAINT "tournament_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "notifications_user_status_idx" ON "notifications" USING btree ("user_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "password_reset_tokens_hash_unique" ON "password_reset_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "password_reset_tokens_user_idx" ON "password_reset_tokens" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "player_registrations_participant_unique" ON "player_registrations" USING btree ("participant_id");--> statement-breakpoint
CREATE INDEX "team_invites_invited_registration_idx" ON "team_invites" USING btree ("invited_registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_pending_unique" ON "team_invites" USING btree ("team_id","invited_registration_id") WHERE "team_invites"."status" = 'pending';--> statement-breakpoint
CREATE INDEX "team_join_requests_registration_idx" ON "team_join_requests" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_join_requests_pending_unique" ON "team_join_requests" USING btree ("team_id","registration_id") WHERE "team_join_requests"."status" = 'pending';--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_registration_unique" ON "team_members" USING btree ("registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_team_starter_role_unique" ON "team_members" USING btree ("team_id","starter_role");--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_one_captain_unique" ON "team_members" USING btree ("team_id") WHERE "team_members"."is_captain" = true;--> statement-breakpoint
CREATE UNIQUE INDEX "teams_name_unique" ON "teams" USING btree ("name");--> statement-breakpoint
CREATE UNIQUE INDEX "tournament_participants_user_unique" ON "tournament_participants" USING btree ("user_id");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "users_discord_id_unique" ON "users" USING btree ("discord_id");