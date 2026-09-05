'use client';

import { OrganizerSettings } from '@/components/tournament/room-communications';

import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import {
  defaultSettings,
  PageFrame,
  type TournamentAppProps,
} from './tournament-app-shared';

export function TournamentAdminSettingsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      {props.settings ? (
        <PageFrame>
          <OrganizerSettings
            deadlineStatus={props.deadlineStatus ?? defaultSettings.deadlineStatus}
            settings={props.settings}
          />
        </PageFrame>
      ) : null}
    </TournamentAppRouteFrame>
  );
}
