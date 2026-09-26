import { notFound } from "next/navigation";

import { TournamentApp, type TournamentView } from "@/components/tournament/tournament-app";
import { fixturePreviewTeams, getFixturePreview } from '@/lib/fixture-preview';

const views: Record<string, TournamentView> = {
  invite: "invite",
  registration: "registration",
  profile: "profile",
  account: "account",
  dashboard: "dashboard",
  builder: "builder",
  submitted: "submitted",
  teams: "teams",
  "team-details": "team-details",
  players: "players",
  "player-details": "player-details",
  "admin-teams": "admin-teams",
  admin: "admin",
  "tier-review": "tier-review",
  fixtures: 'fixtures',
  'admin-fixtures': 'admin-fixtures',
};

export default async function UiPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string | string[]; fixtureState?: string }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const value = Array.isArray(params.screen) ? params.screen[0] : params.screen;
  const view = views[value ?? "dashboard"] ?? "dashboard";

  if (view === 'fixtures' || view === 'admin-fixtures') {
    const state = params.fixtureState;
    const fixtures = state === 'empty' ? null : getFixturePreview(
      state === 'draft' || state === 'playoffs' || state === 'complete' ? state : 'league',
    );
    return <TournamentApp showSignOut={false} view={view} fixtures={fixtures} fixtureTeams={fixturePreviewTeams} fixturePreview />;
  }

  return <TournamentApp showSignOut={false} view={view} />;
}
