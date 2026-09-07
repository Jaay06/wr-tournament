CREATE TYPE "draft_direction" AS ENUM('forward', 'reverse');--> statement-breakpoint
CREATE TYPE "draft_pick_source" AS ENUM('captain', 'organizer', 'auto');--> statement-breakpoint
CREATE TYPE "draft_status" AS ENUM('active', 'paused', 'completed', 'needs_repair');--> statement-breakpoint
CREATE TABLE "draft_picks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"turn_number" integer NOT NULL,
	"round" integer NOT NULL,
	"tier" "tier" NOT NULL,
	"direction" "draft_direction" NOT NULL,
	"previous_tier" "tier" NOT NULL,
	"previous_round" integer NOT NULL,
	"previous_tier_round" integer NOT NULL,
	"previous_team_index" integer NOT NULL,
	"previous_direction" "draft_direction" NOT NULL,
	"team_id" uuid NOT NULL,
	"captain_registration_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"source" "draft_pick_source" NOT NULL,
	"request_key" text,
	"created_by" uuid,
	"committed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"undone_at" timestamp with time zone,
	CONSTRAINT "draft_picks_turn_check" CHECK ("turn_number" > 0),
	CONSTRAINT "draft_picks_round_check" CHECK ("round" > 0)
);
--> statement-breakpoint
CREATE TABLE "draft_pool_players" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"registration_id" uuid NOT NULL,
	"tier" "tier" NOT NULL,
	"available" boolean DEFAULT true NOT NULL,
	"picked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "draft_session_teams" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"session_id" uuid NOT NULL,
	"team_id" uuid NOT NULL,
	"order_index" integer NOT NULL,
	"captain_registration_id" uuid NOT NULL,
	"initial_member_count" integer DEFAULT 1 NOT NULL,
	"incomplete" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_session_teams_order_check" CHECK ("order_index" >= 0),
	CONSTRAINT "draft_session_teams_member_count_check" CHECK ("initial_member_count" = 1)
);
--> statement-breakpoint
CREATE TABLE "draft_sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"status" "draft_status" DEFAULT 'active'::"draft_status" NOT NULL,
	"current_tier" "tier" DEFAULT 'T1'::"tier" NOT NULL,
	"current_round" integer DEFAULT 1 NOT NULL,
	"current_tier_round" integer DEFAULT 1 NOT NULL,
	"current_team_index" integer DEFAULT 0 NOT NULL,
	"direction" "draft_direction" DEFAULT 'forward'::"draft_direction" NOT NULL,
	"turn_number" integer DEFAULT 1 NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"turn_started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"turn_ends_at" timestamp with time zone DEFAULT now() NOT NULL,
	"paused_remaining_seconds" integer,
	"started_at" timestamp with time zone DEFAULT now() NOT NULL,
	"completed_at" timestamp with time zone,
	"created_by" uuid NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "draft_sessions_round_check" CHECK ("current_round" > 0),
	CONSTRAINT "draft_sessions_tier_round_check" CHECK ("current_tier_round" > 0),
	CONSTRAINT "draft_sessions_team_index_check" CHECK ("current_team_index" >= 0),
	CONSTRAINT "draft_sessions_turn_check" CHECK ("turn_number" > 0),
	CONSTRAINT "draft_sessions_version_check" CHECK ("version" > 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX "draft_picks_session_turn_live_unique" ON "draft_picks" ("session_id","turn_number") WHERE "undone_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "draft_picks_session_player_live_unique" ON "draft_picks" ("session_id","registration_id") WHERE "undone_at" is null;--> statement-breakpoint
CREATE UNIQUE INDEX "draft_picks_session_request_key_unique" ON "draft_picks" ("session_id","request_key") WHERE "request_key" is not null;--> statement-breakpoint
CREATE INDEX "draft_picks_session_committed_idx" ON "draft_picks" ("session_id","committed_at");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_pool_players_session_registration_unique" ON "draft_pool_players" ("session_id","registration_id");--> statement-breakpoint
CREATE INDEX "draft_pool_players_available_tier_idx" ON "draft_pool_players" ("session_id","available","tier");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_session_teams_session_team_unique" ON "draft_session_teams" ("session_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_session_teams_session_order_unique" ON "draft_session_teams" ("session_id","order_index");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_session_teams_session_captain_unique" ON "draft_session_teams" ("session_id","captain_registration_id");--> statement-breakpoint
CREATE UNIQUE INDEX "draft_sessions_live_unique" ON "draft_sessions" ("status") WHERE "status" in ('active', 'paused', 'needs_repair');--> statement-breakpoint
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_session_id_draft_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "draft_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_hTkEvX0eWFZo_fkey" FOREIGN KEY ("captain_registration_id") REFERENCES "player_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_registration_id_player_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "player_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_picks" ADD CONSTRAINT "draft_picks_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_pool_players" ADD CONSTRAINT "draft_pool_players_session_id_draft_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "draft_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "draft_pool_players" ADD CONSTRAINT "draft_pool_players_registration_id_player_registrations_id_fkey" FOREIGN KEY ("registration_id") REFERENCES "player_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_session_teams" ADD CONSTRAINT "draft_session_teams_session_id_draft_sessions_id_fkey" FOREIGN KEY ("session_id") REFERENCES "draft_sessions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "draft_session_teams" ADD CONSTRAINT "draft_session_teams_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_session_teams" ADD CONSTRAINT "draft_session_teams_L384BBHHVWQd_fkey" FOREIGN KEY ("captain_registration_id") REFERENCES "player_registrations"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "draft_sessions" ADD CONSTRAINT "draft_sessions_created_by_users_id_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT;