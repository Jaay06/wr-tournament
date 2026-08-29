DROP INDEX "team_invites_pending_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "team_invites_pending_unique" ON "team_invites" ("team_id","invited_registration_id") WHERE "status" = 'pending';--> statement-breakpoint
DROP INDEX "team_join_requests_pending_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "team_join_requests_pending_unique" ON "team_join_requests" ("team_id","registration_id") WHERE "status" = 'pending';--> statement-breakpoint
DROP INDEX "team_members_one_captain_unique";--> statement-breakpoint
CREATE UNIQUE INDEX "team_members_one_captain_unique" ON "team_members" ("team_id") WHERE "is_captain" = true;--> statement-breakpoint
ALTER TABLE "player_registrations" DROP CONSTRAINT "player_registrations_tier_status_check", ADD CONSTRAINT "player_registrations_tier_status_check" CHECK (("tier_status" = 'pending' and "approved_tier" is null) or ("tier_status" = 'approved' and "approved_tier" is not null));--> statement-breakpoint
ALTER TABLE "player_registrations" DROP CONSTRAINT "player_registrations_distinct_roles_check", ADD CONSTRAINT "player_registrations_distinct_roles_check" CHECK ("primary_role" <> "secondary_role");--> statement-breakpoint
ALTER TABLE "team_members" DROP CONSTRAINT "team_members_lineup_role_check", ADD CONSTRAINT "team_members_lineup_role_check" CHECK (("lineup_position" = 'starter' and "starter_role" is not null) or ("lineup_position" = 'substitute' and "starter_role" is null));--> statement-breakpoint
ALTER TABLE "tournament_settings" DROP CONSTRAINT "tournament_settings_singleton_check", ADD CONSTRAINT "tournament_settings_singleton_check" CHECK ("id" = 1);--> statement-breakpoint
ALTER TABLE "users" DROP CONSTRAINT "users_identity_check", ADD CONSTRAINT "users_identity_check" CHECK ("email" is not null or "discord_id" is not null);