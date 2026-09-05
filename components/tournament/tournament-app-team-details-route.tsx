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

function TeamDetailPlayerCard({
  member,
  role,
  slotLabel,
}: {
  member: TournamentMemberData;
  role?: Role;
  slotLabel?: string;
}) {
  const player = playerFromMember(member);

  return (
    <Card className='flex min-h-full flex-col p-4'>
      <div className='flex items-center justify-between gap-3'>
        {role ? <RoleLabel role={role} /> : <Kicker>{slotLabel}</Kicker>}
        {member.isCaptain ? (
          <Badge className='h-auto rounded-full border border-warning/25 bg-warning-soft px-2 py-1 font-mono text-2xs font-semibold tracking-[0.08em] text-warning'>
            <Crown size={12} /> CAPTAIN
          </Badge>
        ) : null}
      </div>

      <div className='mt-5 flex min-w-0 items-center gap-3'>
        <Avatar player={player} size='size-11' />
        <div className='min-w-0'>
          <p className='m-0 truncate font-display text-base font-bold'>
            {member.displayName}
          </p>
          <p className='mt-1 mb-0 truncate font-mono text-xs text-muted-foreground'>
            {member.riotName}#{member.riotTag}
          </p>
        </div>
      </div>

      <div className='mt-5 border-t border-border pt-4'>
        <Kicker>CURRENT RANK</Kicker>
        <p className='mt-2 mb-0 text-sm font-semibold'>{member.currentRank}</p>
      </div>

      <div className='mt-4 flex flex-wrap items-center gap-2'>
        {member.approvedTier ? (
          <>
            <TierBadge tier={member.approvedTier} />
            <span className='text-xs text-muted-foreground'>Approved tier</span>
          </>
        ) : (
          <StatusPill tone='warning'>TIER PENDING</StatusPill>
        )}
      </div>

      <div className='mt-auto pt-5'>
        <Kicker>ROLE PREFERENCES</Kicker>
        <RolePreference
          className='mt-2 text-xs text-secondary-foreground'
          primaryRole={member.primaryRole}
          secondaryRole={member.secondaryRole}
        />
        <span className='mt-4 inline-flex items-center gap-1.5 text-sm font-bold text-primary-muted'>
          View player <ArrowRight size={15} />
        </span>
      </div>
    </Card>
  );
}

function EmptyTeamSlot({ role, label }: { role?: Role; label?: string }) {
  return (
    <Card className='flex min-h-52 flex-col border-dashed bg-secondary/35 p-4'>
      {role ? <RoleLabel role={role} /> : <Kicker>{label}</Kicker>}
      <div className='my-auto py-8 text-center'>
        <span
          aria-hidden='true'
          className='mx-auto grid size-10 place-items-center rounded-full border border-dashed border-border-strong text-muted-foreground'
        >
          <Plus size={16} />
        </span>
        <p className='mt-3 mb-0 text-sm font-semibold text-muted-foreground'>
          Empty slot
        </p>
      </div>
    </Card>
  );
}

function TeamDetailsView({
  teamDetails,
}: {
  teamDetails?: TournamentTeamDetailData | null;
}) {
  const team = teamDetails ?? previewTeamDetails;
  const captain = team.members.find((member) => member.isCaptain);
  const starters = starterSlots.map((role) => ({
    role,
    member: team.members.find(
      (candidate) =>
        candidate.lineupPosition === 'starter' &&
        candidate.starterRole === role,
    ),
  }));
  const substitutes = team.members.filter(
    (member) => member.lineupPosition === 'substitute',
  );
  const displayedMemberIds = new Set([
    ...starters.flatMap(({ member }) => (member ? [member.id] : [])),
    ...substitutes.map((member) => member.id),
  ]);
  const unassignedMembers = team.members.filter(
    (member) => !displayedMemberIds.has(member.id),
  );
  const tierCounts: Record<Tier, number> = { T1: 0, T2: 0, T3: 0, T4: 0 };

  for (const member of team.members) {
    if (member.approvedTier) {
      tierCounts[member.approvedTier] += 1;
    }
  }

  return (
    <PageFrame>
      <div className='flex flex-col gap-6'>
        <Link
          className='-mx-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-bold text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
          href='/tournament/teams'
        >
          <ArrowLeft size={16} /> Back to teams
        </Link>

        <div className='flex flex-wrap items-end justify-between gap-5'>
          <SectionHeading
            detail={`${captain?.displayName ?? 'No captain'} is captain · ${team.members.length} of 7 members`}
            eyebrow='TEAM PROFILE'
            title={team.name}
          />
          <StatusPill
            tone={team.status === 'submitted' ? 'success' : 'primary'}
          >
            {team.status === 'submitted' ? 'SUBMITTED' : 'DRAFT'}
          </StatusPill>
        </div>

        <Card className='overflow-hidden'>
          <div className='grid tablet:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]'>
            <div className='p-5 tablet:p-6'>
              <Kicker>ROSTER STATUS</Kicker>
              <div className='mt-4 grid grid-cols-3 gap-4'>
                <div>
                  <p className='m-0 font-display text-2xl font-bold'>
                    {team.members.length}/7
                  </p>
                  <p className='mt-1 mb-0 text-xs text-muted-foreground'>
                    Members
                  </p>
                </div>
                <div>
                  <p className='m-0 font-display text-2xl font-bold'>
                    {starters.filter(({ member }) => Boolean(member)).length}/5
                  </p>
                  <p className='mt-1 mb-0 text-xs text-muted-foreground'>
                    Starters
                  </p>
                </div>
                <div>
                  <p className='m-0 font-display text-2xl font-bold'>
                    {substitutes.length}/2
                  </p>
                  <p className='mt-1 mb-0 text-xs text-muted-foreground'>
                    Substitutes
                  </p>
                </div>
              </div>
            </div>
            <div className='border-t border-border bg-secondary/55 p-5 tablet:border-t-0 tablet:border-l tablet:p-6'>
              <Kicker>APPROVED TIERS</Kicker>
              <div className='mt-4 flex flex-wrap gap-2'>
                {(Object.keys(tierCounts) as Tier[]).map((tier) => (
                  <Badge
                    className={cn(
                      'h-auto rounded-lg border px-2.5 py-1.5 text-xs',
                      tierMeta[tier].border,
                      tierMeta[tier].soft,
                      tierMeta[tier].text,
                    )}
                    key={tier}
                  >
                    <strong>{tierCounts[tier]}</strong> {tier}
                  </Badge>
                ))}
              </div>
              <p className='mt-4 mb-0 text-xs leading-5 text-muted-foreground'>
                Pending tiers are not included in these totals.
              </p>
            </div>
          </div>
        </Card>

        <section aria-labelledby='starting-lineup-heading'>
          <div className='mb-4'>
            <Kicker>FORMATION</Kicker>
            <h2
              className='mt-2 font-display text-2xl font-bold'
              id='starting-lineup-heading'
            >
              Starting lineup
            </h2>
          </div>
          <div className='grid gap-3 tablet:grid-cols-2 desktop:grid-cols-5'>
            {starters.map(({ role, member }) =>
              member ? (
                <Link
                  className='group block min-h-full rounded-card focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted'
                  href={`/tournament/players/${member.registrationId}`}
                  key={role}
                >
                  <TeamDetailPlayerCard member={member} role={role} />
                </Link>
              ) : (
                <EmptyTeamSlot key={role} role={role} />
              ),
            )}
          </div>
        </section>

        <section aria-labelledby='substitutes-heading'>
          <div className='mb-4'>
            <Kicker>BENCH</Kicker>
            <h2
              className='mt-2 font-display text-2xl font-bold'
              id='substitutes-heading'
            >
              Substitutes
            </h2>
          </div>
          <div className='grid gap-3 tablet:grid-cols-2'>
            {[0, 1].map((index) => {
              const member = substitutes[index];
              return member ? (
                <Link
                  className='group block min-h-full rounded-card focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted'
                  href={`/tournament/players/${member.registrationId}`}
                  key={member.id}
                >
                  <TeamDetailPlayerCard
                    member={member}
                    slotLabel={`SUBSTITUTE ${index + 1}`}
                  />
                </Link>
              ) : (
                <EmptyTeamSlot
                  key={`empty-substitute-${index}`}
                  label={`SUBSTITUTE ${index + 1}`}
                />
              );
            })}
          </div>
        </section>

        {unassignedMembers.length > 0 ? (
          <section aria-labelledby='unassigned-heading'>
            <Alert variant='destructive'>
              <AlertDescription>
                {unassignedMembers.length}{' '}
                {unassignedMembers.length === 1 ? 'member has' : 'members have'}{' '}
                no valid lineup slot. The captain can fix this in My team.
              </AlertDescription>
            </Alert>
            <h2 className='sr-only' id='unassigned-heading'>
              Unassigned members
            </h2>
            <div className='mt-3 grid gap-3 tablet:grid-cols-2'>
              {unassignedMembers.map((member, index) => (
                <Link
                  className='group block min-h-full rounded-card focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted'
                  href={`/tournament/players/${member.registrationId}`}
                  key={member.id}
                >
                  <TeamDetailPlayerCard
                    member={member}
                    slotLabel={`UNASSIGNED ${index + 1}`}
                  />
                </Link>
              ))}
            </div>
          </section>
        ) : null}
      </div>
    </PageFrame>
  );
}

export function TournamentTeamDetailsRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <TeamDetailsView teamDetails={props.teamDetails} />
    </TournamentAppRouteFrame>
  );
}
