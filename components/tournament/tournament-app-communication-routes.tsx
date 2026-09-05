'use client';

import {
  OrganizerAnnouncements,
  ParticipantAnnouncements,
} from '@/components/tournament/room-communications';

import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import {
  defaultSettings,
  PageFrame,
  type TournamentAppProps,
} from './tournament-app-shared';

export function TournamentAnnouncementsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PageFrame>
        <ParticipantAnnouncements
          announcements={props.announcements ?? []}
          deadline={props.deadline ?? defaultSettings.deadline}
          deadlineStatus={props.deadlineStatus ?? defaultSettings.deadlineStatus}
          team={props.team}
        />
      </PageFrame>
    </TournamentAppRouteFrame>
  );
}

export function TournamentAdminAnnouncementsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <PageFrame>
        <OrganizerAnnouncements announcements={props.announcements ?? []} />
      </PageFrame>
    </TournamentAppRouteFrame>
  );
}
