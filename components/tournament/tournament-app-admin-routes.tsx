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

import {
  approveRegistrationTier,
  type TournamentActionState,
} from '@/app/tournament/actions';

function MetricCard({
  label,
  value,
  note,
  tone = 'text-foreground',
}: {
  label: string;
  value: string;
  note: string;
  tone?: string;
}) {
  return (
    <Card className='p-4 desktop:p-5'>
      <Kicker>{label}</Kicker>
      <p
        className={cn(
          'mt-3 font-display text-3xl font-bold tracking-[-0.04em]',
          tone,
        )}
      >
        {value}
      </p>
      <p className='mt-1 text-xs leading-5 text-muted-foreground'>{note}</p>
    </Card>
  );
}

function OrganizerOverview({
  announcements,
  deadline,
  deadlineRemaining,
  deadlineStatus,
  overview,
  region,
  tournamentName,
}: {
  announcements?: TournamentAnnouncementData[];
  deadline: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  overview?: OrganizerOverviewData;
  region: string;
  tournamentName: string;
}) {
  const preview = overview === undefined;
  const previewOverview: OrganizerOverviewData = {
    joinedCount: 42,
    registeredCount: 38,
    pendingTierCount: 6,
    teamCount: 10,
    draftTeamCount: 7,
    submittedTeamCount: 3,
    blockedTeamCount: 2,
    pendingReviews: [
      {
        id: 'preview-rey',
        displayName: 'Rey',
        riotName: 'Rey',
        riotTag: '9301',
        currentRank: 'Diamond II',
        selfAssessedTier: 'T3',
        primaryRole: 'Jungle',
        secondaryRole: 'Baron',
      },
      {
        id: 'preview-niko',
        displayName: 'Niko',
        riotName: 'Niko',
        riotTag: '8128',
        currentRank: 'Master',
        selfAssessedTier: 'T2',
        primaryRole: 'Mid',
        secondaryRole: 'Dragon',
      },
      {
        id: 'preview-kai',
        displayName: 'Kai',
        riotName: 'Kai',
        riotTag: '2288',
        currentRank: 'Emerald I',
        selfAssessedTier: 'T4',
        primaryRole: 'Support',
        secondaryRole: 'Jungle',
      },
    ],
  };
  const currentOverview = overview ?? previewOverview;
  const currentAnnouncements = announcements ?? [];
  return (
    <PageFrame>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <SectionHeading
            detail='Review the work that can block registration or team submission.'
            eyebrow='ORGANIZER OVERVIEW'
            title={`${tournamentName} at a glance`}
          />
          <ButtonLink href='/admin/settings' variant='secondary'>
            <Settings size={16} /> Tournament settings
          </ButtonLink>
        </div>

        <DeadlineBanner
          deadline={deadline}
          remaining={deadlineRemaining}
          status={deadlineStatus}
        />

        <div className='grid grid-cols-2 gap-4 tablet:grid-cols-3 desktop:grid-cols-5'>
          <MetricCard
            label='JOINED'
            note='Entered with the invite'
            value={String(currentOverview.joinedCount)}
          />
          <MetricCard
            label='REGISTERED'
            note='Completed player details'
            value={String(currentOverview.registeredCount)}
          />
          <MetricCard
            label='PENDING TIERS'
            note='Need organizer review'
            tone='text-warning'
            value={String(currentOverview.pendingTierCount)}
          />
          <MetricCard
            label='TEAMS'
            note={`${currentOverview.draftTeamCount} draft · ${currentOverview.submittedTeamCount} submitted`}
            tone='text-primary-muted'
            value={String(currentOverview.teamCount)}
          />
          <MetricCard
            label='BLOCKED TEAMS'
            note='Cannot be submitted yet'
            tone='text-danger'
            value={String(currentOverview.blockedTeamCount)}
          />
        </div>

        <Card className='overflow-hidden'>
          <div className='flex flex-wrap items-end justify-between gap-4 border-b border-border p-5 desktop:p-6'>
            <div>
              <Kicker className='text-warning'>TIER REVIEW QUEUE</Kicker>
              <h2 className='mt-2 font-display text-2xl font-bold'>
                {currentOverview.pendingTierCount}{' '}
                {currentOverview.pendingTierCount === 1
                  ? 'player needs'
                  : 'players need'}{' '}
                a decision
              </h2>
              <p className='mt-2 text-sm text-secondary-foreground'>
                Review one registration at a time.
              </p>
            </div>
            <ButtonLink href='/admin/tier-review'>
              Start review <ArrowRight size={16} />
            </ButtonLink>
          </div>
          <div className='divide-y divide-border'>
            {currentOverview.pendingReviews.slice(0, 3).map((player) => {
              const name = `${player.riotName}#${player.riotTag}`;
              const roles = `${player.primaryRole} · ${player.secondaryRole}`;
              return (
                <div
                  className='grid gap-3 px-5 py-4 tablet:grid-cols-[minmax(0,1fr)_130px_90px_160px_auto] tablet:items-center desktop:px-6'
                  key={player.id}
                >
                  <div className='flex items-center gap-3'>
                    <span className='grid size-9 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground'>
                      {player.displayName.slice(0, 1)}
                    </span>
                    <div>
                      <p className='m-0 text-sm font-semibold'>{name}</p>
                      <p className='mt-1 text-xs text-muted-foreground tablet:hidden'>
                        {player.currentRank} · {roles}
                      </p>
                    </div>
                  </div>
                  <p className='m-0 hidden text-sm text-secondary-foreground tablet:block'>
                    {player.currentRank}
                  </p>
                  <div>
                    <TierBadge tier={player.selfAssessedTier} />
                  </div>
                  <p className='m-0 hidden text-sm text-secondary-foreground tablet:block'>
                    {roles}
                  </p>
                  <ButtonLink
                    className='justify-self-start tablet:justify-self-end'
                    href={
                      preview
                        ? '/admin/tier-review'
                        : `/admin/tier-review?registration=${player.id}`
                    }
                    variant='quiet'
                  >
                    Review <ArrowRight size={15} />
                  </ButtonLink>
                </div>
              );
            })}
          </div>
        </Card>

        <div className='grid gap-5 desktop:grid-cols-3'>
          <Card className='p-5 desktop:p-6' id='teams'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <Kicker>TEAM OVERSIGHT</Kicker>
                <h2 className='mt-2 font-display text-xl font-bold'>
                  {preview
                    ? 'Two drafts are blocked'
                    : currentOverview.blockedTeamCount > 0
                      ? `${currentOverview.blockedTeamCount} ${currentOverview.blockedTeamCount === 1 ? 'team is' : 'teams are'} blocked`
                      : 'All teams are clear'}
                </h2>
              </div>
              <div className='flex items-center gap-3'>
                <Swords
                  className={
                    currentOverview.blockedTeamCount > 0
                      ? 'text-danger'
                      : 'text-success'
                  }
                  size={21}
                />
                <ButtonLink href='/admin/teams' variant='quiet'>
                  Manage <ArrowRight size={15} />
                </ButtonLink>
              </div>
            </div>
            {preview ? (
              <div className='mt-5 flex flex-col gap-3'>
                <div className='flex items-center justify-between gap-3 rounded-xl border border-danger/25 bg-danger-soft p-4'>
                  <div>
                    <p className='m-0 text-sm font-semibold'>Drake Raiders</p>
                    <p className='mt-1 text-xs text-secondary-foreground'>
                      Two T1 players. Maximum is one.
                    </p>
                  </div>
                  <StatusPill tone='danger'>BLOCKED</StatusPill>
                </div>
                <div className='flex items-center justify-between gap-3 rounded-xl border border-warning/25 bg-warning-soft p-4'>
                  <div>
                    <p className='m-0 text-sm font-semibold'>Dawn Guard</p>
                    <p className='mt-1 text-xs text-secondary-foreground'>
                      One member still needs tier approval.
                    </p>
                  </div>
                  <StatusPill tone='warning'>WAITING</StatusPill>
                </div>
              </div>
            ) : (
              <div
                className={cn(
                  'mt-5 rounded-xl border p-4',
                  currentOverview.blockedTeamCount > 0
                    ? 'border-danger/25 bg-danger-soft'
                    : 'border-success/25 bg-success-soft',
                )}
              >
                <p className='m-0 text-sm font-semibold'>
                  {currentOverview.blockedTeamCount > 0
                    ? 'Open team oversight to resolve the blocked rosters.'
                    : 'No team currently has a blocking validation issue.'}
                </p>
                <p className='mt-2 text-xs leading-5 text-secondary-foreground'>
                  The live team workspace includes member controls, lineup
                  repair, and submission unlocks.
                </p>
              </div>
            )}
          </Card>

          <Card className='p-5 desktop:p-6' id='announcements'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <Kicker>ANNOUNCEMENTS</Kicker>
                <h2 className='mt-2 font-display text-xl font-bold'>
                  Latest post
                </h2>
              </div>
              <MessageSquareText className='text-primary-muted' size={21} />
            </div>
            {preview ? (
              <div className='mt-5 rounded-xl border border-border bg-secondary p-4'>
                <p className='m-0 text-sm font-semibold'>
                  Registration closes Sunday
                </p>
                <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                  Submit your roster before the deadline. Match details will
                  stay in Discord.
                </p>
                <p className='mt-3 font-mono text-2xs text-muted-foreground'>
                  POSTED TODAY · 10:15
                </p>
              </div>
            ) : currentAnnouncements.length > 0 ? (
              <div className='mt-5 rounded-xl border border-border bg-secondary p-4'>
                <p className='m-0 text-sm font-semibold'>
                  {currentAnnouncements[0].title}
                </p>
                <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                  {currentAnnouncements[0].body}
                </p>
                <p className='mt-3 font-mono text-2xs text-muted-foreground'>
                  {new Date(
                    currentAnnouncements[0].createdAt,
                  ).toLocaleDateString('en', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            ) : (
              <div className='mt-5 rounded-xl border border-dashed border-border-strong p-4 text-sm text-muted-foreground'>
                No announcements yet.
              </div>
            )}
            <ButtonLink
              className='mt-4 w-full'
              href='/admin/announcements'
              variant='secondary'
            >
              <Plus size={16} /> New announcement
            </ButtonLink>
          </Card>

          <Card className='p-5 desktop:p-6' id='settings-summary'>
            <div className='flex items-start justify-between gap-3'>
              <div>
                <Kicker>TOURNAMENT SETTINGS</Kicker>
                <h2 className='mt-2 font-display text-xl font-bold'>
                  Room details
                </h2>
              </div>
              <Settings className='text-primary-muted' size={21} />
            </div>
            <dl className='mt-5 divide-y divide-border rounded-xl border border-border bg-secondary'>
              <div className='flex items-center justify-between gap-3 p-3.5'>
                <dt className='text-xs text-muted-foreground'>REGION</dt>
                <dd className='m-0 text-sm font-semibold'>{region}</dd>
              </div>
              <div className='flex items-center justify-between gap-3 p-3.5'>
                <dt className='text-xs text-muted-foreground'>DEADLINE</dt>
                <dd className='m-0 text-right text-sm font-semibold'>
                  {deadlineStatus === 'passed'
                    ? 'Closed'
                    : (deadlineRemaining ?? 'Open')}
                </dd>
              </div>
              <div className='flex items-center justify-between gap-3 p-3.5'>
                <dt className='text-xs text-muted-foreground'>INVITE</dt>
                <dd className='m-0 text-sm font-semibold text-success'>
                  PRIVATE
                </dd>
              </div>
            </dl>
            <ButtonLink
              className='mt-4 w-full'
              href='/admin/settings'
              variant='secondary'
            >
              Edit settings <ArrowRight size={15} />
            </ButtonLink>
          </Card>
        </div>
      </div>
    </PageFrame>
  );
}

function OrganizerTierReview({ review }: { review?: TierReviewData | null }) {
  if (review === null) {
    return (
      <PageFrame>
        <Card className='mx-auto max-w-2xl p-8 text-center'>
          <CheckCircle2 className='mx-auto text-success' size={28} />
          <h1 className='mt-4 font-display text-2xl font-bold'>
            Tier review is clear
          </h1>
          <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
            There are no pending player registrations to review.
          </p>
          <ButtonLink className='mt-6' href='/admin'>
            Back to overview <ArrowRight size={16} />
          </ButtonLink>
        </Card>
      </PageFrame>
    );
  }

  return <OrganizerTierReviewContent review={review} />;
}

function OrganizerTierReviewContent({ review }: { review?: TierReviewData }) {
  const previewReview: TierReviewData = {
    id: 'preview-review',
    displayName: 'Rey',
    riotName: 'Rey',
    riotTag: '9301',
    currentRank: 'Diamond II',
    selfAssessedTier: 'T3',
    approvedTier: null,
    tierStatus: 'pending',
    primaryRole: 'Jungle',
    secondaryRole: 'Baron',
    joinedAt: '2026-08-29T00:00:00.000Z',
    updatedAt: '2026-08-30T00:00:00.000Z',
    pendingCount: 6,
    pendingReviews: [
      {
        id: 'preview-review',
        displayName: 'Rey',
        riotName: 'Rey',
        riotTag: '9301',
        currentRank: 'Diamond II',
        selfAssessedTier: 'T3',
        primaryRole: 'Jungle',
        secondaryRole: 'Baron',
      },
      {
        id: 'preview-niko',
        displayName: 'Niko',
        riotName: 'Niko',
        riotTag: '8128',
        currentRank: 'Master',
        selfAssessedTier: 'T2',
        primaryRole: 'Mid',
        secondaryRole: 'Dragon',
      },
      {
        id: 'preview-kai',
        displayName: 'Kai',
        riotName: 'Kai',
        riotTag: '2288',
        currentRank: 'Emerald I',
        selfAssessedTier: 'T4',
        primaryRole: 'Support',
        secondaryRole: 'Jungle',
      },
    ],
  };
  const currentReview = review ?? previewReview;
  const queue = currentReview.pendingReviews ?? [currentReview];
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(currentReview.id);
  const [approvedTier, setApprovedTier] = useState<Tier>(
    currentReview.approvedTier ?? currentReview.selfAssessedTier,
  );
  const [approvedTierReviewId, setApprovedTierReviewId] = useState(
    currentReview.id,
  );
  const [previewSaved, setPreviewSaved] = useState(false);
  const [approvedIds, setApprovedIds] = useState<string[]>([]);
  const [dismissSuccess, setDismissSuccess] = useState(false);
  const [lastDecision, setLastDecision] = useState<{
    id: string;
    displayName: string;
    riotName: string;
    tier: Tier;
  } | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    approveRegistrationTier,
    {},
  );
  const saved =
    ((Boolean(state.success) && Boolean(lastDecision)) || previewSaved) &&
    !dismissSuccess;
  const activeSelectedId = review ? currentReview.id : selectedId;
  const activeApprovedTier =
    review && approvedTierReviewId !== currentReview.id
      ? (currentReview.approvedTier ?? currentReview.selfAssessedTier)
      : approvedTier;
  const visibleQueue = review
    ? queue
    : queue.filter((item) => !approvedIds.includes(item.id));
  const filteredQueue = visibleQueue.filter((item) =>
    `${item.displayName} ${item.riotName} ${item.riotTag} ${item.currentRank}`
      .toLowerCase()
      .includes(query.trim().toLowerCase()),
  );
  const selectedRecord =
    visibleQueue.find((item) => item.id === activeSelectedId) ??
    visibleQueue[0] ??
    currentReview;
  const approvedRecord =
    lastDecision ??
    queue.find((item) => item.id === activeSelectedId) ??
    currentReview;
  const displayTier =
    selectedRecord.id === activeSelectedId
      ? activeApprovedTier
      : selectedRecord.selfAssessedTier;

  function selectReview(id: string) {
    const next = queue.find((item) => item.id === id);
    if (!next) return;
    setSelectedId(id);
    setApprovedTier(next.selfAssessedTier);
    setApprovedTierReviewId(currentReview.id);
    setPreviewSaved(false);
    setDismissSuccess(true);
    setLastDecision(null);
  }

  function moveToNextReview() {
    const next = visibleQueue.find((item) => item.id !== approvedRecord.id);
    setApprovedIds((current) =>
      current.includes(approvedRecord.id)
        ? current
        : [...current, approvedRecord.id],
    );
    setDismissSuccess(true);
    setLastDecision(null);
    if (next) {
      setSelectedId(next.id);
      setApprovedTier(next.selfAssessedTier);
      setApprovedTierReviewId(currentReview.id);
    }
  }

  return (
    <PageFrame>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-start justify-between gap-5'>
          <div>
            <Link
              className='inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-secondary-foreground hover:text-foreground'
              href='/admin'
            >
              <ArrowLeft size={16} /> Overview
            </Link>
            <SectionHeading
              detail='Approve the self-assessed tier or choose the correct one. This decision feeds roster validation.'
              eyebrow='TIER REVIEW'
              title='Review player tiers'
            />
          </div>
          <StatusPill tone={saved ? 'success' : 'warning'}>
            {saved ? 'DECISION SAVED' : `${visibleQueue.length} PENDING`}
          </StatusPill>
        </div>

        {saved ? (
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.99)' }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
          >
            <Card
              className='border-success/30 bg-success-soft p-5'
              aria-live='polite'
            >
              <div className='flex flex-wrap items-center justify-between gap-4'>
                <div className='flex items-start gap-3'>
                  <CheckCircle2
                    className='mt-0.5 shrink-0 text-success'
                    size={21}
                  />
                  <div>
                    <p className='m-0 text-sm font-semibold text-success'>
                      {approvedRecord.riotName} is approved as{' '}
                      {lastDecision?.tier ?? activeApprovedTier}
                    </p>
                    <p className='mt-1 text-sm text-secondary-foreground'>
                      Any team containing {approvedRecord.riotName} will be
                      revalidated.
                    </p>
                  </div>
                </div>
                {visibleQueue.length > 1 ? (
                  <Button
                    className='min-h-10 border border-success/30 bg-background/30 text-foreground hover:bg-background/50'
                    onClick={moveToNextReview}
                    size='sm'
                    type='button'
                  >
                    Review next <ArrowRight size={15} />
                  </Button>
                ) : null}
              </div>
            </Card>
          </motion.div>
        ) : null}

        {visibleQueue.length === 0 ? (
          <Card className='mx-auto w-full max-w-2xl p-8 text-center'>
            <CheckCircle2 className='mx-auto text-success' size={28} />
            <h2 className='mt-4 font-display text-2xl font-bold'>
              Tier review is clear
            </h2>
            <p className='mx-auto mt-2 max-w-md text-sm leading-6 text-secondary-foreground'>
              Every pending registration has a decision. New player profiles
              will appear here when they are ready for review.
            </p>
            <ButtonLink className='mt-6' href='/admin'>
              Back to overview <ArrowRight size={16} />
            </ButtonLink>
          </Card>
        ) : (
          <div className='grid min-w-0 items-start gap-5 desktop:grid-cols-[300px_minmax(0,1fr)]'>
            <aside className='flex min-w-0 flex-col gap-5 desktop:sticky desktop:top-24'>
              <Card className='p-4'>
                <label className='relative block'>
                  <span className='sr-only'>Search pending registrations</span>
                  <Search
                    className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
                    size={16}
                  />
                  <Input
                    aria-label='Search pending registrations'
                    className='min-h-11 rounded-xl pl-9'
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder='Search players'
                    value={query}
                  />
                </label>
              </Card>
              <Card className='overflow-hidden'>
                <div className='flex items-center justify-between gap-3 border-b border-border p-4'>
                  <div>
                    <Kicker>PENDING QUEUE</Kicker>
                    <h2 className='mt-1 font-display text-lg font-bold'>
                      {visibleQueue.length}{' '}
                      {visibleQueue.length === 1
                        ? 'registration'
                        : 'registrations'}
                    </h2>
                  </div>
                  <span className='grid size-8 place-items-center rounded-full bg-warning-soft font-mono text-xs font-bold text-warning'>
                    {visibleQueue.length}
                  </span>
                </div>
                <div className='divide-y divide-border'>
                  {filteredQueue.map((item) => {
                    const itemClass = cn(
                      'flex w-full items-start gap-3 p-4 text-left transition-colors hover:bg-secondary/70 focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-primary-muted',
                      selectedRecord.id === item.id && 'bg-primary-soft',
                    );
                    const content = (
                      <>
                        <span className='grid size-9 shrink-0 place-items-center rounded-full bg-secondary font-display text-sm font-bold text-secondary-foreground'>
                          {item.displayName.slice(0, 1).toUpperCase()}
                        </span>
                        <span className='min-w-0 flex-1'>
                          <strong className='block truncate text-sm'>
                            {item.riotName}#{item.riotTag}
                          </strong>
                          <span className='mt-1 block text-xs text-muted-foreground'>
                            {item.currentRank} · self {item.selfAssessedTier}
                          </span>
                        </span>
                        {selectedRecord.id === item.id ? (
                          <ArrowRight
                            className='mt-1 shrink-0 text-primary-muted'
                            size={15}
                          />
                        ) : null}
                      </>
                    );
                    return review === undefined ? (
                      <button
                        className={itemClass}
                        key={item.id}
                        onClick={() => selectReview(item.id)}
                        type='button'
                      >
                        {content}
                      </button>
                    ) : (
                      <Link
                        className={itemClass}
                        href={`/admin/tier-review?registration=${item.id}`}
                        key={item.id}
                        onClick={() => {
                          setDismissSuccess(true);
                          setLastDecision(null);
                        }}
                      >
                        {content}
                      </Link>
                    );
                  })}
                  {filteredQueue.length === 0 ? (
                    <p className='p-4 text-sm text-muted-foreground'>
                      No pending registrations match that search.
                    </p>
                  ) : null}
                </div>
              </Card>
            </aside>

            <div className='flex min-w-0 flex-col gap-5'>
              <Card className='p-5 desktop:p-6'>
                <div className='flex flex-wrap items-start justify-between gap-4 border-b border-border pb-5'>
                  <div className='flex items-center gap-4'>
                    <span className='grid size-13 place-items-center rounded-full bg-tier-t3 text-background font-display text-lg font-bold'>
                      {selectedRecord.displayName.slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                      <h2 className='m-0 font-display text-xl font-bold'>
                        {selectedRecord.riotName}#{selectedRecord.riotTag}
                      </h2>
                      <p className='mt-1 text-sm text-secondary-foreground'>
                        {selectedRecord.id === currentReview.id
                          ? `Joined ${new Date(currentReview.joinedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })} · registration updated ${new Date(currentReview.updatedAt).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`
                          : 'Pending registration · selected from queue'}
                      </p>
                    </div>
                  </div>
                  <StatusPill tone='warning'>
                    SELF-ASSESSED {selectedRecord.selfAssessedTier}
                  </StatusPill>
                </div>

                <div className='mt-5 grid gap-3 tablet:grid-cols-3'>
                  <div className='rounded-xl border border-border bg-secondary p-4'>
                    <Kicker>CURRENT RANK</Kicker>
                    <p className='mt-2 text-sm font-semibold'>
                      {selectedRecord.currentRank}
                    </p>
                  </div>
                  <div className='rounded-xl border border-border bg-secondary p-4'>
                    <Kicker>PRIMARY ROLE</Kicker>
                    <RoleValue
                      className='mt-2 text-sm font-semibold'
                      role={selectedRecord.primaryRole}
                    />
                  </div>
                  <div className='rounded-xl border border-border bg-secondary p-4'>
                    <Kicker>SECONDARY ROLE</Kicker>
                    <RoleValue
                      className='mt-2 text-sm font-semibold'
                      role={selectedRecord.secondaryRole}
                    />
                  </div>
                </div>

                <fieldset className='mt-7 border-t border-border pt-6'>
                  <legend className='font-display text-xl font-bold'>
                    Approved tier
                  </legend>
                  <FieldDescription className='mt-2'>
                    Diamond maps to T3 by default.
                  </FieldDescription>
                  <RadioGroup
                    className='mt-4 grid gap-3 tablet:grid-cols-2'
                    onValueChange={(value) => {
                      setApprovedTier(value as Tier);
                      setApprovedTierReviewId(currentReview.id);
                      setPreviewSaved(false);
                      setLastDecision(null);
                      setDismissSuccess(true);
                    }}
                    value={activeApprovedTier}
                  >
                    {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                      <label
                        className={cn(
                          'flex min-h-18 cursor-pointer items-center gap-3 rounded-xl border p-4 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/20',
                          activeApprovedTier === tier
                            ? 'border-primary bg-primary-soft'
                            : 'border-border bg-secondary hover:border-border-strong',
                        )}
                        htmlFor={`approved-tier-${tier}`}
                        key={tier}
                      >
                        <RadioGroupItem
                          className='sr-only'
                          id={`approved-tier-${tier}`}
                          value={tier}
                        />
                        <TierBadge tier={tier} />
                        <span className='text-sm text-secondary-foreground'>
                          {tierMeta[tier].range}
                        </span>
                        <span
                          className={cn(
                            'ml-auto grid size-5 place-items-center rounded-full border',
                            activeApprovedTier === tier
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          <AnimatePresence initial={false} mode='wait'>
                            {activeApprovedTier === tier ? (
                              <motion.span
                                animate={{ opacity: 1, transform: 'scale(1)' }}
                                aria-hidden='true'
                                exit={{ opacity: 0, transform: 'scale(0.75)' }}
                                initial={{
                                  opacity: 0,
                                  transform: 'scale(0.75)',
                                }}
                                key='selected'
                                transition={stateSwapTransition}
                              >
                                <Check size={12} />
                              </motion.span>
                            ) : null}
                          </AnimatePresence>
                        </span>
                      </label>
                    ))}
                  </RadioGroup>
                </fieldset>

                <form
                  action={formAction}
                  className='mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between'
                  onSubmit={() => {
                    setDismissSuccess(false);
                    setLastDecision({
                      id: selectedRecord.id,
                      displayName: selectedRecord.displayName,
                      riotName: selectedRecord.riotName,
                      tier: displayTier,
                    });
                  }}
                >
                  <input
                    name='registrationId'
                    type='hidden'
                    value={selectedRecord.id}
                  />
                  <input
                    name='approvedTier'
                    type='hidden'
                    value={displayTier}
                  />
                  <p className='m-0 max-w-md text-xs leading-5 text-muted-foreground'>
                    Changing an approved tier revalidates every affected team.
                    An invalid submitted team returns to draft.
                  </p>
                  {review === undefined ? (
                    <Button
                      className='min-h-11 shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'
                      onClick={(event) => {
                        event.preventDefault();
                        setDismissSuccess(false);
                        setPreviewSaved(true);
                      }}
                      size='lg'
                      type='submit'
                    >
                      <UserRoundCheck size={17} /> Approve {activeApprovedTier}
                    </Button>
                  ) : (
                    <FormSubmitButton className='shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'>
                      <UserRoundCheck size={17} /> Approve {activeApprovedTier}
                    </FormSubmitButton>
                  )}
                  {state.error ? (
                    <Alert
                      aria-live='polite'
                      className='basis-full'
                      variant='destructive'
                    >
                      <AlertDescription>{state.error}</AlertDescription>
                    </Alert>
                  ) : null}
                </form>
              </Card>
              <div className='grid gap-5 tablet:grid-cols-2'>
                <Card className='overflow-hidden'>
                  <div className='border-b border-border p-5'>
                    <Kicker>DEFAULT TIER MAP</Kicker>
                    <h2 className='mt-2 font-display text-xl font-bold'>
                      Rank reference
                    </h2>
                  </div>
                  <div className='divide-y divide-border'>
                    {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                      <div
                        className={cn(
                          'flex items-center gap-3 p-4',
                          activeApprovedTier === tier && 'bg-primary-soft',
                        )}
                        key={tier}
                      >
                        <TierBadge tier={tier} />
                        <p className='m-0 text-sm text-secondary-foreground'>
                          {tierMeta[tier].range}
                        </p>
                      </div>
                    ))}
                  </div>
                </Card>
                <Card className='p-5'>
                  <div className='flex items-center justify-between gap-3'>
                    <Kicker>DECISION GUIDE</Kicker>
                    <ShieldCheck className='text-primary-muted' size={18} />
                  </div>
                  <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
                    Use the current rank and the default map as context. If you
                    change the tier, every affected roster is revalidated.
                  </p>
                  <p className='mt-4 border-t border-border pt-4 text-xs leading-5 text-muted-foreground'>
                    {visibleQueue.length} pending{' '}
                    {visibleQueue.length === 1
                      ? 'registration'
                      : 'registrations'}{' '}
                    remain in the queue.
                  </p>
                </Card>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageFrame>
  );
}

export function TournamentAdminRoute(props: TournamentAppProps) {
  const {
    tournamentName = defaultSettings.tournamentName,
    region = defaultSettings.region,
    deadline = defaultSettings.deadline,
    deadlineRemaining = defaultSettings.deadlineRemaining,
    deadlineStatus = defaultSettings.deadlineStatus,
    overview,
    announcements,
  } = props;

  return (
    <TournamentAppRouteFrame {...props}>
      <OrganizerOverview
        announcements={announcements}
        deadline={deadline}
        deadlineRemaining={deadlineRemaining}
        deadlineStatus={deadlineStatus}
        overview={overview}
        region={region}
        tournamentName={tournamentName}
      />
    </TournamentAppRouteFrame>
  );
}

export function TournamentTierReviewRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <OrganizerTierReview review={props.tierReview} />
    </TournamentAppRouteFrame>
  );
}
