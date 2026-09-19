'use client';

import { PlayerDetailsView, PlayerDirectoryView } from '@/components/tournament/player-directory';
import { AdminPlayerControls } from '@/components/tournament/admin-player-controls';

import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import type { TournamentAppProps } from './tournament-app-shared';

export function TournamentPlayersRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PlayerDirectoryView
        currentRegistrationId={props.currentRegistrationId}
        players={props.players}
      />
    </TournamentAppRouteFrame>
  );
}

export function TournamentPlayerDetailsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PlayerDetailsView
        currentRegistrationId={props.currentRegistrationId}
        playerProfile={props.playerProfile}
      />
    </TournamentAppRouteFrame>
  );
}

export function TournamentAdminPlayersRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PlayerDirectoryView organizer players={props.players} />
    </TournamentAppRouteFrame>
  );
}

export function TournamentAdminPlayerDetailsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PlayerDetailsView
        adminControls={
          props.playerProfile ? (
            <AdminPlayerControls player={props.playerProfile} />
          ) : undefined
        }
        organizer
        playerProfile={props.playerProfile}
      />
    </TournamentAppRouteFrame>
  );
}
