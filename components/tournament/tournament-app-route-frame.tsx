'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

import {
  AppHeader,
  defaultSettings,
  type Tier,
  type TournamentAppProps,
} from './tournament-app-shared';

export function TournamentAppRouteFrame({
  children,
  ...props
}: TournamentAppProps & { children: ReactNode }) {
  const {
    view,
    region = defaultSettings.region,
    deadlineRemaining = defaultSettings.deadlineRemaining,
    deadlineStatus = defaultSettings.deadlineStatus,
    userName = 'Jinxed',
    showSignOut = true,
    registration,
    team,
  } = props;
  const previewRegistration =
    registration === undefined
      ? {
          approvedTier: 'T2' as Tier,
          tierStatus: 'approved' as const,
        }
      : registration;

  return (
    <MotionConfig reducedMotion='user'>
      <div
        className='min-h-[100dvh] bg-background text-foreground'
        data-application-frame
      >
        <AppHeader
          approvedTier={previewRegistration?.approvedTier}
          deadlineRemaining={deadlineRemaining}
          deadlineStatus={deadlineStatus}
          region={region}
          showSignOut={showSignOut}
          teamStatus={
            view === 'submitted' || team?.status === 'submitted'
              ? 'submitted'
              : 'draft'
          }
          tierStatus={previewRegistration?.tierStatus}
          userName={userName}
          view={view}
        />
        {children}
      </div>
    </MotionConfig>
  );
}
