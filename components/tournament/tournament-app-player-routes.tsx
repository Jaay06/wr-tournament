'use client';

import { PlayerDetailsView, PlayerDirectoryView } from '@/components/tournament/player-directory';

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
