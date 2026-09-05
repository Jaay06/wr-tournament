'use client';

/* eslint-disable @typescript-eslint/no-unused-vars */

import Link from 'next/link';
import {
  AnimatePresence,
  LayoutGroup,
  motion,
  useDragControls,
  useReducedMotion,
} from 'motion/react';
import type {
  FormEvent,
  PointerEvent as ReactPointerEvent,
  ReactNode,
} from 'react';
import { useActionState } from 'react';
import { useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowLeftRight,
  ArrowRight,
  Check,
  CheckCircle2,
  Clock3,
  Crown,
  GripVertical,
  Info,
  LockKeyhole,
  MessageSquareText,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  Swords,
  Trash2,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  NativeSelect,
  NativeSelectOption,
} from '@/components/ui/native-select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { RoleIcon } from '@/components/tournament/role-icon';
import {
  arrangeLineupAssignments,
  availableTournamentParticipants,
  participantTeamExitMode,
  reconcileLineupAssignments,
  type LineupAssignment,
  type LineupDropTarget,
  validateRoster,
} from '@/lib/tournament-rules';
import { cn } from '@/lib/utils';
import {
  Avatar,
  ButtonLink,
  Card,
  DeadlineBanner,
  FormSubmitButton,
  Kicker,
  PageFrame,
  RoleLabel,
  RolePreference,
  RoleValue,
  SectionHeading,
  StatusPill,
  TierBadge,
  defaultSettings,
  easeOutExpo,
  lineupDropTargetAtPoint,
  playerFromMember,
  previewTeam,
  previewTeamDetails,
  rosterPlayers,
  starterSlots,
  stateSwapTransition,
  teamCards,
  tierMeta,
} from './tournament-app-shared';
import type { Player, Role, Tier, TournamentAppProps } from './tournament-app-shared';
import { TournamentAppRouteFrame } from './tournament-app-route-frame';
import type {
  OrganizerOverviewData,
  TierReviewData,
  TournamentAnnouncementData,
  TournamentDashboardData,
  TournamentIncomingInviteData,
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentPlayerProfileData,
  TournamentRegistrationData,
  TournamentTeamData,
  TournamentTeamDetailData,
  TournamentTeamSummary,
} from '@/lib/tournament-types';

import { EntryShell } from '@/components/auth/entry-shell';

function InvitePreviewView({
  tournamentName,
  region,
  deadline,
  deadlineRemaining,
  deadlineStatus,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const closed = deadlineStatus === 'passed';

  return (
    <EntryShell
      description='Your private invite is recognized. Sign in to keep it attached and enter the tournament room.'
      eyebrow='PRIVATE INVITE'
      title={closed ? 'This invite is closed.' : 'Your invite is ready.'}
    >
      <div className='flex flex-col gap-5'>
        <Card
          className={cn(
            'rounded-2xl p-4',
            closed
              ? 'border-danger/25 bg-danger-soft'
              : 'border-primary/25 bg-primary-soft',
          )}
          role='status'
        >
          <Kicker className={closed ? 'text-danger' : 'text-primary-muted'}>
            {closed ? 'INVITE CLOSED' : 'INVITE RECOGNIZED'}
          </Kicker>
          <p className='mt-2 mb-0 text-sm leading-5 text-secondary-foreground'>
            {closed
              ? 'Ask the organizer to reopen the invite before continuing.'
              : 'The invite code will stay attached while you sign in or create an account.'}
          </p>
        </Card>

        <div className='grid grid-cols-2 gap-3 max-phone:grid-cols-1'>
          <Card className='rounded-2xl border border-border bg-secondary p-3.5'>
            <Kicker>TOURNAMENT</Kicker>
            <p className='mt-1 mb-0 text-sm font-semibold'>{tournamentName}</p>
          </Card>
          <Card className='rounded-2xl border border-border bg-secondary p-3.5'>
            <Kicker>REGION</Kicker>
            <p className='mt-1 mb-0 text-sm font-semibold'>{region}</p>
          </Card>
          <Card className='col-span-2 rounded-2xl border border-border bg-secondary p-3.5 max-phone:col-span-1'>
            <Kicker>REGISTRATION CLOSES</Kicker>
            <p className='mt-1 mb-0 text-sm font-semibold'>{deadline}</p>
            <p
              className={cn(
                'mt-1 mb-0 font-mono text-2xs font-semibold tracking-[0.08em]',
                closed ? 'text-danger' : 'text-warning',
              )}
            >
              {closed ? 'CLOSED' : (deadlineRemaining ?? 'OPEN')}
            </p>
          </Card>
        </div>

        <div className='border-t border-border pt-5'>
          <p className='m-0 font-mono text-2xs font-semibold tracking-widest text-muted-foreground'>
            NEXT STEP
          </p>
          <p className='mt-2 mb-0 text-sm leading-5 text-secondary-foreground'>
            {closed
              ? 'The organizer controls access to this private tournament.'
              : 'Sign in with Discord or email and password to continue.'}
          </p>
          {!closed ? (
            <ButtonLink
              className='mt-4 w-full'
              href='/signin?callbackUrl=%2Finvite'
            >
              Continue to sign in <ArrowRight size={16} />
            </ButtonLink>
          ) : null}
        </div>
      </div>
    </EntryShell>
  );
}
export { InvitePreviewView };

export function TournamentInviteRoute(props: TournamentAppProps) {
  return (
    <InvitePreviewView
      deadline={props.deadline ?? defaultSettings.deadline}
      deadlineRemaining={
        props.deadlineRemaining ?? defaultSettings.deadlineRemaining
      }
      deadlineStatus={props.deadlineStatus ?? defaultSettings.deadlineStatus}
      region={props.region ?? defaultSettings.region}
      tournamentName={props.tournamentName ?? defaultSettings.tournamentName}
    />
  );
}
