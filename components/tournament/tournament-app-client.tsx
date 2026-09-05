"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";

import { RoomLoading } from "./room-loading";
import type { TournamentAppProps, TournamentView } from "./tournament-app-shared";

type TournamentRoute = ComponentType<TournamentAppProps>;

const inviteRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-invite-view").then(
      ({ TournamentInviteRoute }) => TournamentInviteRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const registrationRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-registration-route").then(
      ({ TournamentRegistrationRoute }) => TournamentRegistrationRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const dashboardRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-dashboard-route").then(
      ({ TournamentDashboardRoute }) => TournamentDashboardRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const teamsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-teams-route").then(
      ({ TournamentTeamsRoute }) => TournamentTeamsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const teamDetailsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-team-details-route").then(
      ({ TournamentTeamDetailsRoute }) => TournamentTeamDetailsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const playersRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-player-routes").then(
      ({ TournamentPlayersRoute }) => TournamentPlayersRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const playerDetailsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-player-routes").then(
      ({ TournamentPlayerDetailsRoute }) => TournamentPlayerDetailsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const teamRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-team-route").then(
      ({ TournamentTeamRoute }) => TournamentTeamRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const adminRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-admin-routes").then(
      ({ TournamentAdminRoute }) => TournamentAdminRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const tierReviewRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-admin-routes").then(
      ({ TournamentTierReviewRoute }) => TournamentTierReviewRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const adminTeamsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-admin-teams-route").then(
      ({ TournamentAdminTeamsRoute }) => TournamentAdminTeamsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const announcementsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-communication-routes").then(
      ({ TournamentAnnouncementsRoute }) => TournamentAnnouncementsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const adminAnnouncementsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-communication-routes").then(
      ({ TournamentAdminAnnouncementsRoute }) =>
        TournamentAdminAnnouncementsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);
const adminSettingsRoute = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app-settings-route").then(
      ({ TournamentAdminSettingsRoute }) => TournamentAdminSettingsRoute,
    ),
  { loading: () => <RoomLoading />, ssr: false },
);

const routes: Record<TournamentView, TournamentRoute> = {
  invite: inviteRoute,
  registration: registrationRoute,
  profile: registrationRoute,
  dashboard: dashboardRoute,
  teams: teamsRoute,
  "team-details": teamDetailsRoute,
  players: playersRoute,
  "player-details": playerDetailsRoute,
  builder: teamRoute,
  submitted: teamRoute,
  admin: adminRoute,
  "tier-review": tierReviewRoute,
  "admin-teams": adminTeamsRoute,
  announcements: announcementsRoute,
  "admin-announcements": adminAnnouncementsRoute,
  "admin-settings": adminSettingsRoute,
};

export function TournamentAppClient(props: TournamentAppProps) {
  const Route = routes[props.view];
  return <Route {...props} />;
}
