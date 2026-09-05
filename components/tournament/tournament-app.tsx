'use client';

import { TournamentAdminAnnouncementsRoute, TournamentAnnouncementsRoute } from './tournament-app-communication-routes';
import { TournamentAdminSettingsRoute } from './tournament-app-settings-route';
import { TournamentAdminTeamsRoute } from './tournament-app-admin-teams-route';
import {
  TournamentAdminRoute,
  TournamentTierReviewRoute,
} from './tournament-app-admin-routes';
import { TournamentDashboardRoute } from './tournament-app-dashboard-route';
import { TournamentInviteRoute } from './tournament-app-invite-view';
import {
  TournamentPlayerDetailsRoute,
  TournamentPlayersRoute,
} from './tournament-app-player-routes';
import { TournamentRegistrationRoute } from './tournament-app-registration-route';
import { TournamentTeamDetailsRoute } from './tournament-app-team-details-route';
import { TournamentTeamRoute } from './tournament-app-team-route';
import { TournamentTeamsRoute } from './tournament-app-teams-route';
import type { TournamentAppProps } from './tournament-app-shared';

export type {
  TournamentAppProps,
  TournamentView,
} from './tournament-app-shared';

export function TournamentApp(props: TournamentAppProps) {
  switch (props.view) {
    case 'invite':
      return <TournamentInviteRoute {...props} />;
    case 'registration':
    case 'profile':
      return <TournamentRegistrationRoute {...props} />;
    case 'dashboard':
      return <TournamentDashboardRoute {...props} />;
    case 'teams':
      return <TournamentTeamsRoute {...props} />;
    case 'team-details':
      return <TournamentTeamDetailsRoute {...props} />;
    case 'players':
      return <TournamentPlayersRoute {...props} />;
    case 'player-details':
      return <TournamentPlayerDetailsRoute {...props} />;
    case 'builder':
    case 'submitted':
      return <TournamentTeamRoute {...props} />;
    case 'admin':
      return <TournamentAdminRoute {...props} />;
    case 'tier-review':
      return <TournamentTierReviewRoute {...props} />;
    case 'admin-teams':
      return <TournamentAdminTeamsRoute {...props} />;
    case 'announcements':
      return <TournamentAnnouncementsRoute {...props} />;
    case 'admin-announcements':
      return <TournamentAdminAnnouncementsRoute {...props} />;
    case 'admin-settings':
      return <TournamentAdminSettingsRoute {...props} />;
  }
}
