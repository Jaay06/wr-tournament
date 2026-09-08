'use client';

import type { ReactNode } from 'react';
import { MotionConfig } from 'motion/react';

import { SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';

import {
  defaultSettings,
  type Tier,
  type TournamentAppProps,
} from './tournament-app-shared';
import { TournamentAppShell } from './tournament-app-shell';

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
      <TooltipProvider delay={0}>
        <SidebarProvider
          className='min-h-dvh bg-background text-foreground'
          data-application-frame
        >
          <TournamentAppShell
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
          >
            {children}
          </TournamentAppShell>
        </SidebarProvider>
      </TooltipProvider>
    </MotionConfig>
  );
}
