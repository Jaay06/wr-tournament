'use client';

import { OrganizerTeamManager } from '@/app/admin/teams/team-manager';

import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import type { TournamentAppProps } from './tournament-app-shared';

export function TournamentAdminTeamsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <OrganizerTeamManager
        participants={props.participants ?? []}
        teams={props.adminTeams ?? []}
      />
    </TournamentAppRouteFrame>
  );
}
