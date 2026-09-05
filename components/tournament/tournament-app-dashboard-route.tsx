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
  markAllNotificationsRead,
  type TournamentActionState,
} from '@/app/tournament/actions';

type DashboardBadgeTone =
  | 'neutral'
  | 'primary'
  | 'success'
  | 'warning'
  | 'danger';

function DashboardBadge({
  children,
  tone = 'neutral',
  compact = false,
}: {
  children: ReactNode;
  tone?: DashboardBadgeTone;
  compact?: boolean;
}) {
  const tones: Record<DashboardBadgeTone, string> = {
    neutral: 'bg-secondary text-secondary-foreground',
    primary: 'bg-primary-soft text-primary-muted',
    success: 'bg-success-soft text-success',
    warning: 'bg-warning-soft text-warning',
    danger: 'bg-danger-soft text-danger',
  };

  return (
    <Badge
      className={cn(
        'inline-flex rounded-full border-0 font-mono font-bold tracking-[0.08em]',
        compact
          ? 'min-h-6 rounded-lg px-2.5 py-1 text-[10px]'
          : 'min-h-8 px-4 py-2 text-[12px]',
        tones[tone],
      )}
    >
      {children}
    </Badge>
  );
}

function dashboardAvatarClass(player: Player) {
  if (player.tierStatus === 'pending')
    return 'bg-primary text-primary-foreground';
  if (player.isCaptain) return 'bg-primary text-primary-foreground';
  return {
    T1: 'bg-tier-t1 text-background',
    T2: 'bg-tier-t2 text-background',
    T3: 'bg-tier-t3 text-background',
    T4: 'bg-tier-t4 text-background',
  }[player.tier];
}

function DashboardStarterCard({ role, player }: { role: Role; player?: Player }) {
  return <div className={cn(
    'min-w-0 rounded-lg border border-border p-3 desktop:min-h-[88px]',
    player ? 'bg-secondary' : 'hidden place-items-center bg-background/35 desktop:grid',
  )} aria-label={role + (player ? ': ' + player.name : ': open slot')}>
    <div className="flex items-center justify-between gap-2">
      <RoleIcon className={cn('size-5', player ? 'text-role-icon' : 'text-muted-foreground')} roleName={role} />
      {player && <span className="font-mono text-[8px] text-success">STARTER</span>}
    </div>
    {player && <div className="mt-3 flex min-w-0 items-center gap-2">
      <Avatar player={{ ...player, avatarClass: dashboardAvatarClass(player) }} size="size-7" />
      <div className="min-w-0"><p className="m-0 truncate text-sm font-bold">{player.name}</p>
        <p className="mt-0.5 mb-0 text-[10px] text-muted-foreground">{player.tierStatus === 'pending' ? 'Tier pending' : player.tier} - {player.primaryRole} / {player.secondaryRole}</p>
      </div>
    </div>}
  </div>;
}

function dashboardTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime()) || !/^\d{4}-\d{2}-\d{2}/.test(value))
    return value;
  return date.toLocaleDateString('en', { month: 'short', day: 'numeric' });
}

function dashboardNotificationTitle(type: string, message: string) {
  const normalized = `${type} ${message}`.toLowerCase();
  if (normalized.includes('tier') || normalized.includes('approved'))
    return 'Tier approved';
  if (normalized.includes('join') || normalized.includes('request'))
    return 'Join request received';
  return 'Tournament update';
}

function dashboardNotificationTone(type: string): DashboardBadgeTone {
  const normalized = type.toLowerCase();
  if (normalized.includes('tier') || normalized.includes('approved'))
    return 'success';
  if (normalized.includes('join') || normalized.includes('request'))
    return 'primary';
  return 'neutral';
}

function RevisedDashboardView({
  tournamentName,
  region,
  deadline,
  deadlineStatus,
  userName,
  registration,
  team,
  dashboard,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  userName: string;
  registration?: TournamentRegistrationData | null;
  team?: TournamentTeamData | null;
  dashboard?: TournamentDashboardData;
}) {
  const preview = registration === undefined;
  const previewRegistration: TournamentRegistrationData = {
    id: 'preview-registration',
    riotName: 'Jinxed',
    riotTag: '0420',
    currentRank: 'Diamond IV',
    selfAssessedTier: 'T3',
    approvedTier: 'T2',
    tierStatus: 'approved',
    primaryRole: 'Mid',
    secondaryRole: 'Support',
  };
  const liveRegistration =
    registration === undefined ? previewRegistration : registration;
  const profileName = userName || liveRegistration?.riotName || 'Player';
  const liveTeam = team === undefined ? null : team;
  const hasTeam = preview || Boolean(liveTeam);
  const teamMembers = liveTeam?.members ?? [];
  const teamStarters: Array<Player | undefined> = liveTeam
    ? starterSlots.map((role) => {
        const member = liveTeam.members.find(
          (candidate) =>
            candidate.lineupPosition === 'starter' &&
            candidate.starterRole === role,
        );
        return member ? playerFromMember(member) : undefined;
      })
    : preview
      ? rosterPlayers.slice(0, 5)
      : [];
  const starterCount = liveTeam
    ? teamMembers.filter((member) => member.lineupPosition === 'starter').length
    : preview
      ? 5
      : 0;
  const substituteCount = liveTeam
    ? teamMembers.filter((member) => member.lineupPosition === 'substitute')
        .length
    : preview
      ? 1
      : 0;
  const captainName =
    liveTeam?.members.find((member) => member.isCaptain)?.displayName ??
    (preview ? 'Jinxed' : profileName);
  const validation = liveTeam
    ? validateRoster(liveTeam.members)
    : preview
      ? {
          valid: true,
          blockingIssues: [],
          warnings: ['Mori prefers Baron or Support, not Dragon.'],
          tierCounts: { T1: 1, T2: 0, T3: 4, T4: 1 },
        }
      : null;
  const previewAnnouncements: TournamentAnnouncementData[] = [
    {
      id: 'preview-deadline',
      title: 'Submission deadline',
      body: 'Team submissions close with registration.',
      createdAt: '2h',
    },
    {
      id: 'preview-reviews',
      title: 'Tier reviews underway',
      body: 'Pending players may still join draft teams.',
      createdAt: 'Yesterday',
    },
  ];
  const previewNotifications = [
    {
      id: 'preview-header',
      type: 'join_accepted',
      message: 'Your request to join a team was accepted.',
      status: 'unread' as const,
      createdAt: '18 minutes ago',
    },
    {
      id: 'preview-tier',
      type: 'tier_approved',
      message: 'Your approved tier is T3.',
      status: 'unread' as const,
      createdAt: '2h',
    },
    {
      id: 'preview-request',
      type: 'join_request',
      message: 'Kai wants to join Void Hunters.',
      status: 'read' as const,
      createdAt: 'Yesterday',
    },
  ];
  const announcements = preview
    ? previewAnnouncements
    : (dashboard?.announcements ?? []);
  const notifications = preview
    ? previewNotifications
    : (dashboard?.notifications ?? []);
  const [notificationState, markAllAction] = useActionState<
    TournamentActionState,
    FormData
  >(markAllNotificationsRead, {});
  const unreadCount = notificationState.success
    ? 0
    : notifications.filter((notification) => notification.status === 'unread')
        .length;
  const profileTierLabel = liveRegistration?.approvedTier
    ? `${liveRegistration.approvedTier} APPROVED`
    : liveRegistration?.tierStatus === 'pending'
      ? 'TIER PENDING'
      : 'PROFILE INCOMPLETE';
  const validationTone: DashboardBadgeTone = validation?.blockingIssues.length
    ? 'danger'
    : validation?.warnings.length
      ? 'warning'
      : 'success';
  const profileStatus = liveRegistration?.approvedTier ? 'Your profile is approved.' : liveRegistration ? 'Your tier is awaiting review.' : 'Complete your player profile.';
  const teamStatusText = liveTeam?.status === 'submitted' ? 'Your team roster is submitted.' : hasTeam ? (starterCount < 5 ? 'Your draft team needs ' + (5 - starterCount) + ' more starters.' : 'Review the lineup before submission.') : 'Create a team or join an open roster.';

  return <PageFrame>
    <div aria-label={tournamentName + ' ' + region + ' participant dashboard'} className="flex flex-col gap-5">
      <div className="flex flex-col justify-between gap-4 tablet:flex-row tablet:items-start">
        <div><Kicker className="text-primary">PARTICIPANT OVERVIEW</Kicker><h1 className="mt-2 mb-0 text-[28px] font-bold leading-[1.1] tracking-[-0.035em] desktop:text-[34px]">Make the next move.</h1><p className="mt-2 mb-0 text-sm leading-relaxed text-secondary-foreground">{profileStatus} {teamStatusText}</p></div>
        <Card className={cn('w-full rounded-xl p-3.5 ring-0 tablet:w-44', deadlineStatus === 'passed' ? 'border-danger/30 bg-danger-soft' : 'border-success/30 bg-success-soft')}>
          <Kicker>REGISTRATION</Kicker><div className="mt-2 flex justify-between gap-3 tablet:block"><p className={cn('m-0 text-sm font-semibold', deadlineStatus === 'passed' ? 'text-danger' : 'text-success')}>{deadlineStatus === 'passed' ? 'Closed' : 'Open'}</p><p className="m-0 text-xs leading-relaxed text-secondary-foreground">{deadlineStatus === 'open' ? 'No closing time set' : deadline}</p></div>
        </Card>
      </div>
      <div className="grid items-start gap-[18px] desktop:grid-cols-[minmax(0,1fr)_280px]">
        <Card className="min-w-0 rounded-[14px] p-[18px] ring-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0"><Kicker>YOUR TEAM</Kicker><div className="mt-2 flex flex-wrap items-center gap-2"><h2 className="m-0 truncate text-2xl font-bold">{hasTeam ? liveTeam?.name ?? 'Void Hunters' : 'No team yet'}</h2>{hasTeam && <span className="font-mono text-[9px] text-muted-foreground">{liveTeam?.status === 'submitted' ? 'SUBMITTED' : 'DRAFT'}</span>}</div><p className="mt-1 mb-0 text-sm text-muted-foreground">{hasTeam ? 'Captain ' + captainName + ' - ' + (teamMembers.length || 6) + ' of 7 members' : 'Create a team or browse draft rosters.'}</p></div>
            {hasTeam && <div className="shrink-0 text-right"><Kicker>STARTERS</Kicker><p className="mt-1 mb-0 text-xl font-semibold">{starterCount}<span className="text-xs text-muted-foreground"> / 5</span></p></div>}
          </div>
          {hasTeam ? <>
            <div className="mt-4 grid gap-2 desktop:grid-cols-5">{starterSlots.map((role, index) => <DashboardStarterCard key={role} role={role} player={teamStarters[index]} />)}
              {starterCount < 5 && <div className="flex items-center gap-3 rounded-lg border border-dashed border-border px-3 py-4 text-sm text-muted-foreground desktop:hidden"><Plus size={18} />{5 - starterCount} starter slots open</div>}
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              <p className={cn('m-0 text-sm font-semibold', validationTone === 'danger' ? 'text-danger' : validationTone === 'warning' ? 'text-warning' : 'text-success')}>{validation?.blockingIssues.length ? validation.blockingIssues.length + ' blockers. Roster invalid.' : liveTeam?.status === 'submitted' ? 'Roster submitted.' : 'Roster valid.'}</p>
              <div className="grid w-full gap-2 phone:flex phone:w-auto"><ButtonLink className="h-11 min-h-11 text-sm" href="/tournament/team" variant="secondary">Open team room <ArrowRight size={15} /></ButtonLink><ButtonLink className="h-11 min-h-11 text-sm" href="/tournament/teams" variant="secondary">Browse teams</ButtonLink></div>
            </div>
          </> : <div className="py-8"><p className="text-sm text-secondary-foreground">Find friends to fill the five starting roles.</p><div className="flex flex-wrap gap-2"><ButtonLink href={liveRegistration ? '/tournament/team' : '/tournament/register'}><Plus size={16} />{liveRegistration ? 'Create a team' : 'Complete profile'}</ButtonLink><ButtonLink href="/tournament/teams" variant="secondary">Browse teams</ButtonLink></div></div>}
        </Card>
        <aside className="grid gap-4">
          <Card className="rounded-[14px] bg-secondary p-[18px] ring-0" id="notifications">
            <div className="flex items-center justify-between gap-2"><Kicker>DIRECT NOTICES</Kicker><span className="text-xs text-primary">{unreadCount} new</span></div>
            <div className="mt-3 divide-y divide-border">{notifications.slice(0, 3).map(notification => <article className="py-3 first:pt-0" key={notification.id}><p className={cn('m-0 text-sm leading-relaxed', notification.type === 'tier_approved' ? 'text-success' : 'text-foreground')}>{notification.message}</p><p className="mt-1 mb-0 text-2xs text-muted-foreground">{dashboardTime(notification.createdAt)}</p></article>)}</div>
            {!notifications.length && <p className="text-sm text-muted-foreground">No direct notices yet.</p>}
            {dashboard !== undefined && unreadCount > 0 && <form action={markAllAction} className="mt-3"><FormSubmitButton className="min-h-9 rounded-lg bg-background px-3 text-xs text-foreground">Mark all read</FormSubmitButton></form>}
            {notificationState.error && <p role="alert" className="text-sm text-danger">{notificationState.error}</p>}
          </Card>
          <Card className="rounded-[14px] p-[18px] ring-0" id="announcements">
            <Kicker>ANNOUNCEMENTS</Kicker>
            {announcements.length ? announcements.slice(0, 2).map(post => <article className="mt-3" key={post.id}><h3 className="m-0 text-sm font-bold">{post.title}</h3><p className="mt-1 mb-0 line-clamp-2 text-xs leading-relaxed text-muted-foreground">{post.body}</p></article>) : <><h3 className="mt-3 mb-1 text-lg font-bold">No posts yet.</h3><p className="m-0 text-xs leading-relaxed text-muted-foreground">Tournament updates will appear here.</p></>}
            <ButtonLink className="mt-4 min-h-10 w-full text-xs" href="/tournament/announcements" variant="secondary">View announcements</ButtonLink>
          </Card>
        </aside>
      </div>
      <Card className="flex flex-col gap-4 rounded-xl p-4 ring-0 tablet:flex-row tablet:items-center tablet:justify-between">
        <div><Kicker>NEXT STEPS</Kicker><p className="mt-2 mb-0 text-base font-bold">{liveTeam?.status === 'submitted' ? 'Your roster is locked. Watch for room updates.' : 'Finish the roster before you submit.'}</p></div>
        <div className="flex flex-wrap gap-2">
          <Link href="/tournament/profile" className="rounded-lg bg-success-soft px-3 py-2 text-xs text-success">{liveRegistration?.approvedTier ? 'Profile approved' : liveRegistration ? 'Tier pending' : 'Complete profile'}</Link>
          <Link href="/tournament/team" className="rounded-lg bg-warning-soft px-3 py-2 text-xs text-warning">Build the lineup</Link>
          <Link href="/tournament/team" className={cn('rounded-lg px-3 py-2 text-xs', validation?.valid ? 'bg-success-soft text-success' : 'bg-secondary text-muted-foreground')}>{liveTeam?.status === 'submitted' ? 'View submission' : 'Review submission'}</Link>
        </div>
      </Card>
    </div>
  </PageFrame>;
}

export function TournamentDashboardRoute(props: TournamentAppProps) {
  const {
    tournamentName = defaultSettings.tournamentName,
    region = defaultSettings.region,
    deadline = defaultSettings.deadline,
    deadlineRemaining = defaultSettings.deadlineRemaining,
    deadlineStatus = defaultSettings.deadlineStatus,
    userName = 'Jinxed',
    registration,
    team,
    dashboard,
  } = props;

  return (
    <TournamentAppRouteFrame {...props}>
      <RevisedDashboardView
        dashboard={dashboard}
        deadline={deadline}
        deadlineRemaining={deadlineRemaining}
        deadlineStatus={deadlineStatus}
        region={region}
        registration={registration}
        team={team}
        tournamentName={tournamentName}
        userName={userName}
      />
    </TournamentAppRouteFrame>
  );
}
