import { notFound } from "next/navigation";

import { TournamentApp, type TournamentView } from "@/components/tournament/tournament-app";

const views: Record<string, TournamentView> = {
  invite: "invite",
  registration: "registration",
  profile: "profile",
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
};

export default async function UiPreviewPage({
  searchParams,
}: {
  searchParams: Promise<{ screen?: string | string[] }>;
}) {
  if (process.env.NODE_ENV === "production") {
    notFound();
  }

  const params = await searchParams;
  const value = Array.isArray(params.screen) ? params.screen[0] : params.screen;
  const view = views[value ?? "dashboard"] ?? "dashboard";

  return <TournamentApp showSignOut={false} view={view} />;
}
