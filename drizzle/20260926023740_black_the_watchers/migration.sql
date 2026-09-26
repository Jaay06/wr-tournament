CREATE TYPE "fixture_phase" AS ENUM('draft', 'league', 'playoffs', 'complete');--> statement-breakpoint
CREATE TYPE "fixture_stage" AS ENUM('league', 'semifinal', 'final');--> statement-breakpoint
CREATE TABLE "fixture_competitions" (
	"id" integer PRIMARY KEY DEFAULT 1,
	"version" integer DEFAULT 1 NOT NULL,
	"phase" "fixture_phase" DEFAULT 'draft'::"fixture_phase" NOT NULL,
	"playoff_order" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "fixture_competitions_singleton_check" CHECK ("id" = 1),
	CONSTRAINT "fixture_competitions_version_check" CHECK ("version" > 0)
);
--> statement-breakpoint
CREATE TABLE "fixture_entries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"competition_id" integer NOT NULL,
	"team_id" uuid NOT NULL,
	"seed" integer NOT NULL,
	CONSTRAINT "fixture_entries_seed_check" CHECK ("seed" > 0)
);
--> statement-breakpoint
CREATE TABLE "fixture_matches" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
	"competition_id" integer NOT NULL,
	"stage" "fixture_stage" NOT NULL,
	"round" integer NOT NULL,
	"position" integer NOT NULL,
	"home_team_id" uuid,
	"away_team_id" uuid,
	"home_score" integer,
	"away_score" integer,
	"scheduled_at" timestamp with time zone,
	CONSTRAINT "fixture_matches_round_check" CHECK ("round" > 0),
	CONSTRAINT "fixture_matches_position_check" CHECK ("position" > 0),
	CONSTRAINT "fixture_matches_distinct_teams_check" CHECK ("home_team_id" is null or "away_team_id" is null or "home_team_id" <> "away_team_id"),
	CONSTRAINT "fixture_matches_scores_pair_check" CHECK (("home_score" is null and "away_score" is null) or ("home_score" is not null and "away_score" is not null)),
	CONSTRAINT "fixture_matches_scores_team_check" CHECK ("home_score" is null or ("home_team_id" is not null and "away_team_id" is not null)),
	CONSTRAINT "fixture_matches_bo3_score_check" CHECK ("home_score" is null or (("home_score" = 2 and "away_score" in (0, 1)) or ("away_score" = 2 and "home_score" in (0, 1))))
);
--> statement-breakpoint
CREATE UNIQUE INDEX "fixture_entries_competition_team_unique" ON "fixture_entries" ("competition_id","team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixture_entries_competition_seed_unique" ON "fixture_entries" ("competition_id","seed");--> statement-breakpoint
CREATE INDEX "fixture_entries_team_idx" ON "fixture_entries" ("team_id");--> statement-breakpoint
CREATE UNIQUE INDEX "fixture_matches_competition_slot_unique" ON "fixture_matches" ("competition_id","stage","round","position");--> statement-breakpoint
CREATE INDEX "fixture_matches_competition_idx" ON "fixture_matches" ("competition_id");--> statement-breakpoint
ALTER TABLE "fixture_entries" ADD CONSTRAINT "fixture_entries_competition_id_fixture_competitions_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "fixture_competitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fixture_entries" ADD CONSTRAINT "fixture_entries_team_id_teams_id_fkey" FOREIGN KEY ("team_id") REFERENCES "teams"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fixture_matches" ADD CONSTRAINT "fixture_matches_competition_id_fixture_competitions_id_fkey" FOREIGN KEY ("competition_id") REFERENCES "fixture_competitions"("id") ON DELETE CASCADE;--> statement-breakpoint
ALTER TABLE "fixture_matches" ADD CONSTRAINT "fixture_matches_home_team_id_teams_id_fkey" FOREIGN KEY ("home_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT;--> statement-breakpoint
ALTER TABLE "fixture_matches" ADD CONSTRAINT "fixture_matches_away_team_id_teams_id_fkey" FOREIGN KEY ("away_team_id") REFERENCES "teams"("id") ON DELETE RESTRICT;