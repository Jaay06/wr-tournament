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
import { AnimatedButtonLabel } from '@/components/ui/animated-button-label';
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

import {
  requestToJoinTeam,
  type TournamentActionState,
} from '@/app/tournament/actions';

function BrowseTeamsView({
  teams,
  registration,
  team,
  deadlineStatus,
}: {
  teams?: TournamentTeamSummary[];
  registration?: TournamentRegistrationData | null;
  team?: TournamentTeamData | null;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'one' | 'two' | 'draft'>('all');
  const [requestedTeam, setRequestedTeam] = useState<string | null>(null);
  const preview = teams === undefined;
  const [requestState, requestAction] = useActionState<
    TournamentActionState,
    FormData
  >(requestToJoinTeam, {});

  const cards = useMemo(() => {
    if (teams === undefined) {
      return teamCards.map((team, index) => ({
        ...team,
        id: `preview-team-${index}`,
        openSlots: Math.max(0, 7 - Number(team.members.split('/')[0].trim())),
      }));
    }

    return teams.map((team) => ({
      id: team.id,
      name: team.name,
      captain: team.captain,
      members: `${team.memberCount} / 7`,
      state:
        team.status === 'submitted'
          ? ('SUBMITTED' as const)
          : ('DRAFT' as const),
      eligible: team.status === 'draft' && team.memberCount < 7,
      openSlots: Math.max(0, 7 - team.memberCount),
      tiers: team.tierCounts,
    }));
  }, [teams]);

  const filteredTeams = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return cards.filter((team) => {
      const matchesQuery = `${team.name} ${team.captain}`
        .toLowerCase()
        .includes(normalized);
      const matchesFilter =
        filter === 'all' ||
        (filter === 'one' && team.openSlots === 1) ||
        (filter === 'two' && team.openSlots >= 2) ||
        (filter === 'draft' && team.state === 'DRAFT');
      return matchesQuery && matchesFilter;
    });
  }, [cards, filter, query]);

  const alreadyOnTeam = Boolean(team);
  const changesClosed = deadlineStatus === 'passed';
  const canRequest =
    !alreadyOnTeam &&
    !changesClosed &&
    (teams === undefined || Boolean(registration));

  return (
    <PageFrame>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <SectionHeading
            detail='Compare team size and approved tier totals before asking a captain to join.'
            eyebrow='BROWSE TEAMS'
            title='Find a draft with room'
          />
          <div className='grid w-full gap-2 phone:flex phone:w-auto phone:flex-wrap'>
            <ButtonLink
              className='w-full phone:w-auto'
              href='/tournament/players'
              variant='secondary'
            >
              <Users size={16} /> Browse players
            </ButtonLink>
            <ButtonLink
              className='w-full phone:w-auto'
              href={
                preview || registration
                  ? '/tournament/team'
                  : '/tournament/register'
              }
            >
              <Plus size={16} />{' '}
              {preview || registration ? 'Create a team' : 'Complete profile'}
            </ButtonLink>
          </div>
        </div>

        <Card className='p-4'>
          <div className='flex flex-col gap-3 tablet:flex-row tablet:items-center'>
            <label className='relative flex-1'>
              <span className='sr-only'>Search teams</span>
              <Search
                className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground'
                size={17}
              />
              <Input
                aria-label='Search teams'
                className='min-h-12 rounded-xl pl-10 text-base'
                onChange={(event) => setQuery(event.target.value)}
                placeholder='Search team or captain'
                value={query}
              />
            </label>
          </div>
          <div
            className='mt-3 flex flex-wrap gap-2'
            aria-label='Team filters'
            role='group'
          >
            {(
              [
                ['all', 'All teams'],
                ['one', '1 open'],
                ['two', '2+ open'],
                ['draft', 'Draft'],
              ] as const
            ).map(([value, label]) => (
              <Button
                aria-pressed={filter === value}
                className={cn(
                  'min-h-10 rounded-full px-3.5 py-2 text-xs font-bold',
                  filter === value
                    ? 'border border-primary/35 bg-primary-soft text-primary-muted hover:bg-primary-soft/80'
                    : 'border border-border bg-secondary text-secondary-foreground hover:border-border-strong',
                )}
                key={value}
                onClick={() => setFilter(value)}
                size='sm'
                type='button'
              >
                {label}
              </Button>
            ))}
          </div>
        </Card>

        <Card
          className={cn(
            'p-4',
            canRequest
              ? 'border-success/25 bg-success-soft/60'
              : 'border-warning/25 bg-warning-soft/60',
          )}
        >
          <div className='flex items-start gap-3'>
            <span
              className={cn(
                'mt-0.5 grid size-9 shrink-0 place-items-center rounded-xl',
                canRequest
                  ? 'bg-success/12 text-success'
                  : 'bg-warning/12 text-warning',
              )}
              aria-hidden='true'
            >
              {canRequest ? (
                <CheckCircle2 size={18} />
              ) : (
                <AlertTriangle size={18} />
              )}
            </span>
            <div>
              <p className='m-0 text-sm font-semibold'>
                {alreadyOnTeam
                  ? 'You already have a team'
                  : changesClosed
                    ? 'Team changes are closed'
                    : registration?.approvedTier
                      ? `You are eligible as ${registration.approvedTier}`
                      : registration || teams === undefined
                        ? 'You are eligible to request a spot'
                        : 'Complete registration first'}
              </p>
              <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                {alreadyOnTeam
                  ? 'You can browse teams, but leave your current team before requesting another spot.'
                  : changesClosed
                    ? 'The registration deadline has passed, so new requests are unavailable.'
                    : registration || teams === undefined
                      ? 'Request a spot from any draft roster with room. Tier approval is only required before team submission.'
                      : 'Complete your player registration before requesting a team spot.'}
              </p>
            </div>
          </div>
        </Card>

        <div className='flex items-center justify-between gap-3'>
          <Kicker>{filteredTeams.length} TEAMS</Kicker>
          <p className='m-0 text-xs text-muted-foreground'>
            A submitted roster cannot take requests.
          </p>
        </div>

        <div className='grid gap-4 tablet:grid-cols-2 desktop:grid-cols-3'>
          {filteredTeams.map((team) => {
            const requestSent =
              requestedTeam === team.id ||
              (teams === undefined && requestedTeam === team.name) ||
              (Boolean(requestState.success) &&
                requestState.teamId === team.id);
            return (
              <Card
                className='flex min-h-full flex-col overflow-hidden'
                key={team.id}
              >
                <Link
                  className='group block rounded-t-card p-5 focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-primary-muted'
                  href={
                    preview
                      ? '/ui-preview?screen=team-details'
                      : `/tournament/teams/${team.id}`
                  }
                >
                  <div className='flex items-start justify-between gap-3'>
                    <span
                      className='grid size-11 place-items-center rounded-xl bg-primary-soft font-display text-lg font-bold text-primary-muted'
                      aria-hidden='true'
                    >
                      {team.name.slice(0, 1)}
                    </span>
                    <StatusPill
                      tone={team.state === 'SUBMITTED' ? 'success' : 'primary'}
                    >
                      {team.state}
                    </StatusPill>
                  </div>
                  <h2 className='mt-5 font-display text-xl font-bold'>
                    {team.name}
                  </h2>
                  <p className='mt-1 text-sm text-secondary-foreground'>
                    Captain {team.captain}
                  </p>

                  <div className='mt-5 grid grid-cols-2 gap-3 border-y border-border py-4'>
                    <div>
                      <Kicker>MEMBERS</Kicker>
                      <p className='mt-2 font-display text-lg font-bold'>
                        {team.members}
                      </p>
                    </div>
                    <div>
                      <Kicker>OPEN SLOTS</Kicker>
                      <p
                        className={cn(
                          'mt-2 text-sm font-semibold',
                          team.openSlots > 0 && team.state === 'DRAFT'
                            ? 'text-success'
                            : 'text-muted-foreground',
                        )}
                      >
                        {team.state === 'DRAFT' && team.openSlots > 0
                          ? `${team.openSlots} available`
                          : 'Roster locked'}
                      </p>
                    </div>
                  </div>

                  <div className='mt-4'>
                    <Kicker>APPROVED TIERS</Kicker>
                    <div className='mt-3 flex flex-wrap gap-2'>
                      {(Object.keys(team.tiers) as Tier[]).map((tier) => (
                        <Badge
                          className={cn(
                            'h-auto rounded-lg border px-2 py-1 text-xs',
                            tierMeta[tier].border,
                            tierMeta[tier].soft,
                            tierMeta[tier].text,
                          )}
                          key={tier}
                        >
                          <strong>{team.tiers[tier]}</strong> {tier}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <span className='mt-5 inline-flex items-center gap-2 text-sm font-bold text-primary-muted'>
                    View team
                    <ArrowRight
                      className='transition-transform group-hover:translate-x-0.5'
                      size={16}
                    />
                  </span>
                </Link>

                <div className='mt-auto border-t border-border bg-secondary/55 p-4'>
                  {team.eligible && canRequest ? (
                    preview ? (
                      <Button
                        className={cn(
                          'min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-bold',
                          requestSent
                            ? 'border border-success/30 bg-success-soft text-success'
                            : 'bg-primary text-primary-foreground hover:bg-primary-hover',
                        )}
                        disabled={requestSent}
                        onClick={() => setRequestedTeam(team.name)}
                        size='lg'
                        type='button'
                      >
                        <AnimatedButtonLabel
                          stateKey={requestSent ? 'sent' : 'idle'}
                        >
                          {requestSent ? (
                            <>
                              <Check size={16} /> Request sent
                            </>
                          ) : (
                            <>
                              <Send size={16} /> Request to join
                            </>
                          )}
                        </AnimatedButtonLabel>
                      </Button>
                    ) : (
                      <form action={requestAction}>
                        <input name='teamId' type='hidden' value={team.id} />
                        <FormSubmitButton
                          className={cn(
                            'w-full',
                            requestSent
                              ? 'border border-success/30 bg-success-soft text-success'
                              : 'bg-primary text-primary-foreground hover:bg-primary-hover',
                          )}
                          stateKey={requestSent ? 'sent' : 'idle'}
                        >
                          {requestSent ? (
                            <>
                              <Check size={16} /> Request sent
                            </>
                          ) : (
                            <>
                              <Send size={16} /> Request to join
                            </>
                          )}
                        </FormSubmitButton>
                      </form>
                    )
                  ) : (
                    <div>
                      <Button
                        className='min-h-11 w-full rounded-xl border border-border bg-secondary text-muted-foreground'
                        disabled
                        size='lg'
                        type='button'
                      >
                        <LockKeyhole size={16} />{' '}
                        {team.eligible
                          ? alreadyOnTeam
                            ? 'Already on a team'
                            : changesClosed
                              ? 'Requests closed'
                              : 'Registration needed'
                          : team.state === 'SUBMITTED'
                            ? 'Requests closed'
                            : 'Team full'}
                      </Button>
                      <p className='mt-2 mb-0 text-center text-xs text-muted-foreground'>
                        {team.eligible
                          ? alreadyOnTeam
                            ? 'Leave your current team before requesting another.'
                            : changesClosed
                              ? 'The deadline has passed.'
                              : 'Complete registration first.'
                          : team.state === 'SUBMITTED'
                            ? 'The captain already submitted this roster.'
                            : 'This roster already has seven members.'}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filteredTeams.length === 0 ? (
          <Empty className='rounded-card border border-dashed border-border-strong bg-secondary/45 p-8'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Search size={16} />
              </EmptyMedia>
              <EmptyTitle className='font-display text-xl font-bold'>
                No teams match that search
              </EmptyTitle>
              <EmptyDescription>
                Clear the search or show submitted teams.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : null}
        {teams !== undefined && requestState.error ? (
          <Alert aria-live='polite' variant='destructive'>
            <AlertDescription>{requestState.error}</AlertDescription>
          </Alert>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function TournamentTeamsRoute(props: TournamentAppProps) {
  const {
    deadlineStatus = defaultSettings.deadlineStatus,
    registration,
    team,
    teams,
  } = props;

  return (
    <TournamentAppRouteFrame {...props}>
      <BrowseTeamsView
        deadlineStatus={deadlineStatus}
        registration={registration}
        team={team}
        teams={teams}
      />
    </TournamentAppRouteFrame>
  );
}
