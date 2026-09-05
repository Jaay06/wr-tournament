'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  AnimatePresence,
  LayoutGroup,
  MotionConfig,
  motion,
  useDragControls,
  useReducedMotion,
} from 'motion/react';
import type {
  FormEvent,
  HTMLAttributes,
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
  LogOut,
  Menu,
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

import {
  approveRegistrationTier,
  createTeam,
  deleteTeam,
  inviteParticipant,
  leaveTeam,
  markAllNotificationsRead,
  renameTeam,
  requestToJoinTeam,
  respondToJoinRequest,
  respondToTeamInvite,
  savePlayerRegistration,
  submitTeam,
  transferTeamCaptaincy,
  updateTeamLineup,
  type TournamentActionState,
} from '@/app/tournament/actions';
import { OrganizerTeamManager } from '@/app/admin/teams/team-manager';
import { EntryShell } from '@/components/auth/entry-shell';
import { RiftClashMark } from '@/components/brand/rift-clash-logo';
import { OrganizerAnnouncements, OrganizerSettings, ParticipantAnnouncements, type RoomSettings } from '@/components/tournament/room-communications';
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
import { AnimatedButtonLabel } from '@/components/ui/animated-button-label';
import { Avatar as ShadcnAvatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card as ShadcnCard } from '@/components/ui/card';
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
  PlayerDetailsView,
  PlayerDirectoryView,
} from '@/components/tournament/player-directory';
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
import type {
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
  OrganizerOverviewData,
} from '@/lib/tournament-types';

export type TournamentView =
  | 'invite'
  | 'registration'
  | 'profile'
  | 'dashboard'
  | 'teams'
  | 'team-details'
  | 'players'
  | 'player-details'
  | 'builder'
  | 'submitted'
  | 'admin'
  | 'tier-review'
  | 'admin-teams'
  | 'announcements'
  | 'admin-announcements'
  | 'admin-settings';

type Tier = 'T1' | 'T2' | 'T3' | 'T4';
type Role = 'Baron' | 'Jungle' | 'Mid' | 'Dragon' | 'Support';
type StatusTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger';

export type TournamentAppProps = {
  view: TournamentView;
  tournamentName?: string;
  region?: string;
  deadline?: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  userName?: string;
  showSignOut?: boolean;
  registration?: TournamentRegistrationData | null;
  teams?: TournamentTeamSummary[];
  team?: TournamentTeamData | null;
  teamDetails?: TournamentTeamDetailData | null;
  players?: TournamentPlayerProfileData[];
  playerProfile?: TournamentPlayerProfileData | null;
  tierReview?: TierReviewData | null;
  currentRegistrationId?: string;
  dashboard?: TournamentDashboardData;
  overview?: OrganizerOverviewData;
  participants?: TournamentParticipantOption[];
  adminTeams?: TournamentTeamData[];
  announcements?: TournamentAnnouncementData[];
  incomingInvites?: TournamentIncomingInviteData[];
  settings?: RoomSettings;
};

type Player = {
  name: string;
  riotId: string;
  rank: string;
  tier: Tier;
  tierStatus?: 'pending' | 'approved';
  primaryRole: Role;
  secondaryRole: Role;
  initial: string;
  avatarClass: string;
  isCaptain?: boolean;
};

function playerFromMember(member: TournamentMemberData): Player {
  const tier = member.approvedTier ?? 'T4';
  const avatarClass = member.approvedTier
    ? tierMeta[member.approvedTier].soft.replace('bg-', 'bg-') +
      ' ' +
      tierMeta[member.approvedTier].text
    : 'bg-secondary text-secondary-foreground';

  return {
    name: member.displayName,
    riotId: `${member.riotName}#${member.riotTag}`,
    rank: member.currentRank,
    tier,
    tierStatus: member.tierStatus,
    primaryRole: member.primaryRole,
    secondaryRole: member.secondaryRole,
    initial: member.displayName.slice(0, 1).toUpperCase(),
    avatarClass,
    isCaptain: member.isCaptain,
  };
}

const defaultSettings = {
  tournamentName: 'Rift Clash VI',
  region: 'EU West',
  deadline: 'Sep 6, 2026 · 23:59 UTC',
  deadlineRemaining: '6D 14H LEFT',
  deadlineStatus: 'upcoming' as const,
};

const tierMeta: Record<
  Tier,
  { range: string; badge: string; border: string; soft: string; text: string }
> = {
  T1: {
    range: 'Sovereign through Challenger',
    badge: 'border-tier-t1/35 bg-tier-t1/12 text-tier-t1',
    border: 'border-tier-t1/35',
    soft: 'bg-tier-t1/10',
    text: 'text-tier-t1',
  },
  T2: {
    range: 'Grandmaster through Master',
    badge: 'border-tier-t2/35 bg-tier-t2/12 text-tier-t2',
    border: 'border-tier-t2/35',
    soft: 'bg-tier-t2/10',
    text: 'text-tier-t2',
  },
  T3: {
    range: 'Diamond',
    badge: 'border-tier-t3/35 bg-tier-t3/12 text-tier-t3',
    border: 'border-tier-t3/35',
    soft: 'bg-tier-t3/10',
    text: 'text-tier-t3',
  },
  T4: {
    range: 'Emerald and below',
    badge: 'border-tier-t4/35 bg-tier-t4/12 text-tier-t4',
    border: 'border-tier-t4/35',
    soft: 'bg-tier-t4/10',
    text: 'text-tier-t4',
  },
};

const rosterPlayers: Player[] = [
  {
    name: 'Akin',
    riotId: 'Akin#1701',
    rank: 'Challenger',
    tier: 'T1',
    primaryRole: 'Baron',
    secondaryRole: 'Mid',
    initial: 'A',
    avatarClass: 'bg-tier-t1 text-background',
  },
  {
    name: 'Pix',
    riotId: 'Pix#1808',
    rank: 'Emerald I',
    tier: 'T4',
    primaryRole: 'Jungle',
    secondaryRole: 'Dragon',
    initial: 'P',
    avatarClass: 'bg-tier-t4 text-background',
  },
  {
    name: 'Jinxed',
    riotId: 'Jinxed#0420',
    rank: 'Diamond IV',
    tier: 'T3',
    primaryRole: 'Mid',
    secondaryRole: 'Support',
    initial: 'J',
    avatarClass: 'bg-primary text-primary-foreground',
    isCaptain: true,
  },
  {
    name: 'Mori',
    riotId: 'Mori#2202',
    rank: 'Diamond II',
    tier: 'T3',
    primaryRole: 'Baron',
    secondaryRole: 'Support',
    initial: 'M',
    avatarClass: 'bg-tier-t3 text-background',
  },
  {
    name: 'Sola',
    riotId: 'Sola#7712',
    rank: 'Diamond III',
    tier: 'T3',
    primaryRole: 'Support',
    secondaryRole: 'Dragon',
    initial: 'S',
    avatarClass: 'bg-primary-muted text-background',
  },
  {
    name: 'Rey',
    riotId: 'Rey#9301',
    rank: 'Diamond II',
    tier: 'T3',
    primaryRole: 'Jungle',
    secondaryRole: 'Baron',
    initial: 'R',
    avatarClass: 'bg-tier-t3 text-background',
  },
];

const starterSlots = ['Baron', 'Jungle', 'Mid', 'Dragon', 'Support'] as const;

function lineupDropTargetAtPoint(point: { x: number; y: number }) {
  const elements = document.elementsFromPoint(
    point.x - window.scrollX,
    point.y - window.scrollY,
  );

  for (const element of elements) {
    const target = element.closest<HTMLElement>('[data-lineup-drop-kind]');
    if (!target) continue;

    const kind = target.dataset.lineupDropKind;
    if (kind === 'starter') {
      const role = target.dataset.lineupRole as Role | undefined;
      if (role && starterSlots.includes(role)) {
        return { kind, role } satisfies LineupDropTarget;
      }
    }
    if (kind === 'substitute') {
      return { kind } satisfies LineupDropTarget;
    }
    if (kind === 'player' && target.dataset.registrationId) {
      return {
        kind,
        registrationId: target.dataset.registrationId,
      } satisfies LineupDropTarget;
    }
  }

  return null;
}

const previewTeamDetails: TournamentTeamDetailData = {
  id: 'preview-team',
  name: 'Night Sentinels',
  status: 'draft',
  submittedAt: null,
  members: rosterPlayers.map((player, index) => {
    const [riotName, riotTag] = player.riotId.split('#');
    return {
      id: `preview-member-${index}`,
      registrationId: `preview-registration-${index}`,
      displayName: player.name,
      avatarUrl: null,
      riotName,
      riotTag,
      currentRank: player.rank,
      approvedTier: player.tier,
      tierStatus: 'approved',
      primaryRole: player.primaryRole,
      secondaryRole: player.secondaryRole,
      isCaptain: Boolean(player.isCaptain),
      lineupPosition: index < starterSlots.length ? 'starter' : 'substitute',
      starterRole: index < starterSlots.length ? starterSlots[index] : null,
    };
  }),
};

const previewTeam: TournamentTeamData = {
  ...previewTeamDetails,
  joinRequests: [],
  invites: [],
};

const teamCards = [
  {
    name: 'Night Sentinels',
    captain: 'Rey#9301',
    members: '4 / 7',
    state: 'DRAFT' as const,
    eligible: true,
    tiers: { T1: 0, T2: 1, T3: 2, T4: 1 },
  },
  {
    name: 'Aegis Five',
    captain: 'Niko#8128',
    members: '5 / 7',
    state: 'DRAFT' as const,
    eligible: true,
    tiers: { T1: 1, T2: 1, T3: 2, T4: 1 },
  },
  {
    name: 'Drake Raiders',
    captain: 'Mira#4404',
    members: '7 / 7',
    state: 'SUBMITTED' as const,
    eligible: false,
    tiers: { T1: 0, T2: 2, T3: 4, T4: 1 },
  },
];

const easeOutExpo = [0.19, 1, 0.22, 1] as const;
const stateSwapTransition = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
} as const;

function DashboardBrand({ href, organizer = false }: { href: string; organizer?: boolean }) {
  return (
    <Link
      aria-label='Rift Clash home'
      className='flex min-h-11 shrink-0 items-center gap-2.5 rounded-lg focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
      href={href}
    >
      <RiftClashMark className='size-7 shrink-0' />
      <span className='flex min-w-0 flex-col leading-none'>
        <span className='font-display text-[15px] font-bold tracking-[0.02em] text-current'>
          RIFT CLASH
        </span>
        <span className='mt-1 font-mono text-[9px] font-medium tracking-[0.1em] text-current opacity-55'>
          {organizer ? 'ORGANIZER ROOM' : 'PRIVATE WILD RIFT'}
        </span>
      </span>
    </Link>
  );
}

function ClientSignOutButton({
  compact = false,
  iconOnly = false,
}: {
  compact?: boolean;
  iconOnly?: boolean;
}) {
  const [pending, setPending] = useState(false);

  async function handleSignOut() {
    setPending(true);
    await signOut({ callbackUrl: '/' });
  }

  return (
    <Button
      className={cn(
        'border border-white/10 bg-white/5 text-shell-sidebar-foreground hover:border-white/20 hover:bg-white/10',
        iconOnly
          ? 'size-9 min-h-9 shrink-0 rounded-lg border-0 bg-transparent p-0 text-shell-sidebar-muted hover:bg-white/6 hover:text-shell-sidebar-foreground'
          : compact
            ? 'min-h-9 rounded-full px-3.5 py-2 text-xs'
            : 'min-h-11 w-full',
      )}
      disabled={pending}
      onClick={handleSignOut}
      size={iconOnly ? 'icon' : compact ? 'sm' : 'lg'}
      type='button'
      aria-label={iconOnly ? 'Sign out' : undefined}
    >
      {iconOnly ? (
        <>
          <LogOut aria-hidden='true' size={15} />
          <span className='sr-only'>
            {pending ? 'Signing out...' : 'Sign out'}
          </span>
        </>
      ) : pending ? (
        'Signing out...'
      ) : (
        'Sign out'
      )}
    </Button>
  );
}

function AppHeader({
  view,
  region,
  userName,
  showSignOut,
  teamStatus,
  approvedTier,
  tierStatus,
  deadlineRemaining,
  deadlineStatus,
}: {
  view: TournamentView;
  region: string;
  userName: string;
  showSignOut: boolean;
  teamStatus?: 'draft' | 'submitted';
  approvedTier?: Tier | null;
  tierStatus?: 'pending' | 'approved';
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const organizer =
    view === 'admin' || view === 'tier-review' || view.startsWith('admin-');
  const participantItems = [
    {
      key: 'dashboard',
      label: 'Overview',
      href: '/tournament',
      icon: ShieldCheck,
    },
    {
      key: 'profile',
      label: 'Profile',
      href: '/tournament/profile',
      icon: UserRoundCheck,
    },
    { key: 'builder', label: 'My team', href: '/tournament/team', icon: Users },
    {
      key: 'teams',
      label: 'Browse teams',
      href: '/tournament/teams',
      icon: Search,
    },
    {
      key: 'announcements',
      label: 'Announcements',
      href: '/tournament/announcements',
      icon: MessageSquareText,
    },
  ] as const;
  const organizerItems = [
    { key: 'admin', label: 'Overview', href: '/admin', icon: ShieldCheck },
    {
      key: 'tier-review',
      label: 'Tier review',
      href: '/admin/tier-review',
      icon: UserRoundCheck,
    },
    { key: 'teams-admin', label: 'Teams', href: '/admin/teams', icon: Users },
    {
      key: 'announcements',
      label: 'Announcements',
      href: '/admin/announcements',
      icon: MessageSquareText,
    },
    {
      key: 'settings',
      label: 'Settings',
      href: '/admin/settings',
      icon: Settings,
    },
  ] as const;
  const items = organizer ? organizerItems : participantItems;
  const activeKey =
    view === 'registration'
      ? 'profile'
      : view === 'team-details' ||
          view === 'players' ||
          view === 'player-details'
        ? 'teams'
        : view === 'submitted'
          ? 'builder'
          : view === 'admin-teams'
            ? 'teams-admin'
            : view === 'admin-announcements' ? 'announcements'
              : view === 'admin-settings' ? 'settings' : view;
  const participantTierLabel = approvedTier
    ? `${approvedTier} APPROVED`
    : tierStatus === 'pending'
      ? 'TIER PENDING'
      : 'PROFILE INCOMPLETE';
  const deadlineLabel =
    deadlineStatus === 'passed' ? 'CLOSED' : (deadlineRemaining ?? 'OPEN');
  const activeItem = items.find((item) => item.key === activeKey);
  const homeHref = organizer ? '/admin' : '/tournament';
  const teamRoom = view === 'builder' || view === 'submitted';

  return (
    <>
      <aside className='fixed inset-y-0 left-0 z-40 hidden w-[244px] flex-col border-r border-white/10 bg-shell-sidebar px-[18px] py-7 text-shell-sidebar-foreground desktop:flex'>
        <div className='px-1'>
          <DashboardBrand href={homeHref} organizer={organizer} />
        </div>
        <div className='mt-5 border-t border-white/10 pt-6'>
          <p className='m-0 px-3 font-mono text-[9px] font-semibold tracking-[0.2em] text-shell-sidebar-muted'>
            {organizer ? 'CONTROL ROOM' : 'TOURNAMENT'}
          </p>
          <nav
            className='mt-4 flex flex-col gap-1'
            aria-label={organizer ? 'Organizer' : 'Tournament'}
          >
            {items.map(({ href, icon: Icon, key, label }) => (
              <Link
                className={cn(
                  'relative flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-shell-sidebar-muted transition-[background-color,color,transform] duration-150 hover:bg-white/6 hover:text-shell-sidebar-foreground active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
                  activeKey === key &&
                    'bg-white/9 font-semibold text-shell-sidebar-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary',
                )}
                href={href}
                aria-current={activeKey === key ? 'page' : undefined}
                key={key}
              >
                <Icon aria-hidden='true' size={17} strokeWidth={1.7} />
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className='mt-auto flex flex-col gap-4'>
          {!teamRoom ? (
            <div className='rounded-xl border border-white/10 bg-white/4 p-3.5'>
              <p className='m-0 font-mono text-[9px] font-semibold tracking-[0.16em] text-shell-sidebar-muted'>
                {organizer ? 'ROOM STATUS' : 'REGISTRATION'}
              </p>
              <p className='mt-2 mb-0 text-sm font-semibold text-success'>
                {deadlineStatus === 'passed' ? 'Closed' : 'Open'}
              </p>
              <p className='mt-1 mb-0 text-[11px] leading-4 text-shell-sidebar-muted'>
                {deadlineStatus === 'open'
                  ? 'No closing time set.'
                  : deadlineLabel}
              </p>
            </div>
          ) : null}
          <div className='flex items-center gap-3 border-t border-white/10 pt-4'>
            <span className='grid size-9 shrink-0 place-items-center rounded-full bg-white/10 text-sm font-bold'>
              {userName.slice(0, 1).toUpperCase()}
            </span>
            <span className='min-w-0 flex-1'>
              <span className='block truncate text-sm font-semibold'>
                {userName}
              </span>
              <span className='mt-0.5 block font-mono text-[8px] tracking-[0.12em] text-shell-sidebar-muted'>
                {organizer
                  ? 'ORGANIZER'
                  : teamRoom
                    ? `${region.toUpperCase()} / ${participantTierLabel}`
                    : participantTierLabel}
              </span>
            </span>
            {showSignOut && teamRoom ? <ClientSignOutButton iconOnly /> : null}
          </div>
          {showSignOut && !teamRoom ? <ClientSignOutButton /> : null}
        </div>
      </aside>

      <header className='sticky top-0 z-30 border-b border-border bg-background/94 backdrop-blur-xl desktop:ml-[244px]'>
        <div className='flex min-h-[76px] items-center gap-4 px-[18px] desktop:min-h-[78px] desktop:px-[34px]'>
          <div className='text-foreground desktop:hidden'>
            <DashboardBrand href={homeHref} organizer={organizer} />
          </div>
          <div className='hidden min-w-0 items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground desktop:flex'>
            <span>{organizer ? 'CONTROL ROOM' : 'TOURNAMENT'}</span>
            <span aria-hidden='true'>/</span>
            <span className='truncate text-foreground'>
              {activeItem?.label ?? 'Overview'}
            </span>
          </div>

          <div className='ml-auto hidden items-center gap-2 desktop:flex'>
            {teamRoom ? (
              <span
                className={cn(
                  'font-mono text-[9px] font-semibold tracking-[0.12em]',
                  teamStatus === 'submitted' ? 'text-success' : 'text-danger',
                )}
              >
                {(teamStatus ?? 'draft').toUpperCase()}
              </span>
            ) : (
              <StatusPill
                tone={
                  organizer ? 'primary' : approvedTier ? 'success' : 'warning'
                }
              >
                {organizer ? 'ORGANIZER' : participantTierLabel}
              </StatusPill>
            )}
            {!organizer && !teamRoom ? (
              <StatusPill
                tone={deadlineStatus === 'passed' ? 'danger' : 'warning'}
              >
                {deadlineLabel}
              </StatusPill>
            ) : null}
            <Badge className='h-auto rounded-full border border-border bg-card px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.1em] text-muted-foreground'>
              {region.toUpperCase()}
            </Badge>
            <span
              className='grid size-9 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground'
              aria-hidden='true'
            >
              {userName.slice(0, 1).toUpperCase()}
            </span>
          </div>

          <Button
            aria-expanded={menuOpen}
            aria-label={menuOpen ? 'Close navigation' : 'Open navigation'}
            className='ml-auto size-10 rounded-lg border border-border bg-secondary text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted desktop:hidden'
            onClick={() => setMenuOpen((open) => !open)}
            size='icon-lg'
            type='button'
          >
            {menuOpen ? <X size={19} /> : <Menu size={19} />}
          </Button>
        </div>

        <AnimatePresence initial={false}>
          {menuOpen ? (
            <motion.div
              animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
              className='absolute inset-x-0 top-full border-t border-border bg-card px-5 py-4 shadow-2xl shadow-background/35 desktop:hidden'
              exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.99)' }}
              initial={{
                opacity: 0,
                transform: 'translateY(-8px) scale(0.98)',
              }}
              key='mobile-navigation'
              style={{ transformOrigin: 'top right' }}
              transition={{ duration: 0.18, ease: easeOutExpo }}
            >
              <nav
                className='mx-auto flex max-w-page flex-col gap-1'
                aria-label={
                  organizer ? 'Mobile organizer' : 'Mobile tournament'
                }
              >
                {items.map(({ href, icon: Icon, key, label }) => (
                  <Link
                    className={cn(
                      'flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-semibold text-secondary-foreground',
                      activeKey === key && 'bg-primary-soft text-primary-muted',
                    )}
                    href={href}
                    aria-current={activeKey === key ? 'page' : undefined}
                    key={key}
                    onClick={() => setMenuOpen(false)}
                  >
                    <Icon aria-hidden='true' size={17} strokeWidth={1.7} />
                    {label}
                  </Link>
                ))}
                {showSignOut ? (
                  <div className='mt-3 border-t border-border pt-3'>
                    <ClientSignOutButton />
                  </div>
                ) : null}
              </nav>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </header>
    </>
  );
}

function PageFrame({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        'w-full px-[18px] py-[22px] desktop:ml-[244px] desktop:w-[calc(100%-244px)] desktop:px-[34px] desktop:py-7',
        className,
      )}
    >
      {children}
    </main>
  );
}

function Card({
  children,
  className,
  id,
  role,
}: {
  children: ReactNode;
  className?: string;
  id?: string;
  role?: HTMLAttributes<HTMLDivElement>['role'];
}) {
  return (
    <ShadcnCard
      className={cn(
        'rounded-card border border-border bg-card gap-0',
        className,
      )}
      id={id}
      role={role}
    >
      {children}
    </ShadcnCard>
  );
}

function Kicker({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <p
      className={cn(
        'm-0 font-mono text-2xs font-semibold tracking-[0.14em] text-muted-foreground',
        className,
      )}
    >
      {children}
    </p>
  );
}

function RoleLabel({ role, className }: { role: Role; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RoleIcon className='size-4' roleName={role} />
      <Kicker>{role.toUpperCase()}</Kicker>
    </div>
  );
}

function RoleValue({ role, className }: { role: Role; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <RoleIcon className='size-3.5' roleName={role} />
      <span>{role}</span>
    </span>
  );
}

function RolePreference({
  primaryRole,
  secondaryRole,
  className,
}: {
  primaryRole: Role;
  secondaryRole: Role;
  className?: string;
}) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-x-2 gap-y-1', className)}
    >
      <RoleValue role={primaryRole} />
      <span aria-hidden='true' className='text-muted-foreground'>
        ·
      </span>
      <RoleValue role={secondaryRole} />
    </div>
  );
}

function SectionHeading({
  eyebrow,
  title,
  detail,
}: {
  eyebrow: string;
  title: string;
  detail?: string;
}) {
  return (
    <div>
      <Kicker className='text-primary-muted'>{eyebrow}</Kicker>
      <h1 className='mt-3 max-w-3xl font-display text-3xl font-bold leading-[1.05] tracking-[-0.04em] text-foreground desktop:text-[46px]'>
        {title}
      </h1>
      {detail ? (
        <p className='mt-3 max-w-2xl text-base leading-6 text-secondary-foreground'>
          {detail}
        </p>
      ) : null}
    </div>
  );
}

function TierBadge({ tier }: { tier: Tier }) {
  return (
    <Badge
      className={cn(
        'h-auto min-h-6 min-w-9 rounded-lg border px-2 py-1 font-mono text-2xs font-bold',
        tierMeta[tier].badge,
      )}
    >
      {tier}
    </Badge>
  );
}

function StatusPill({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: StatusTone;
}) {
  const tones: Record<StatusTone, string> = {
    neutral: 'border-border bg-secondary text-secondary-foreground',
    primary: 'border-primary/30 bg-primary-soft text-primary-muted',
    success: 'border-success/25 bg-success-soft text-success',
    warning: 'border-warning/25 bg-warning-soft text-warning',
    danger: 'border-danger/25 bg-danger-soft text-danger',
  };

  return (
    <Badge
      className={cn(
        'h-auto min-h-7 rounded-full border px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em]',
        tones[tone],
      )}
    >
      <span className='size-1.5 rounded-full bg-current' aria-hidden='true' />
      {children}
    </Badge>
  );
}

function Avatar({
  player,
  size = 'size-10',
}: {
  player: Player;
  size?: string;
}) {
  return (
    <ShadcnAvatar
      className={cn('rounded-full font-display text-sm font-bold', size)}
      aria-hidden='true'
    >
      <AvatarFallback
        className={cn(
          'rounded-full font-display text-sm font-bold',
          player.avatarClass,
        )}
      >
        {player.initial}
      </AvatarFallback>
    </ShadcnAvatar>
  );
}

function ButtonLink({
  children,
  href,
  variant = 'primary',
  className,
}: {
  children: ReactNode;
  href: string;
  variant?: 'primary' | 'secondary' | 'quiet';
  className?: string;
}) {
  return (
    <Link
      className={cn(
        buttonVariants({
          size: 'lg',
          variant:
            variant === 'primary'
              ? 'default'
              : variant === 'secondary'
                ? 'secondary'
                : 'ghost',
        }),
        'min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold',
        variant === 'primary' &&
          'shadow-lg shadow-primary/20 hover:bg-primary-hover',
        variant === 'secondary' &&
          'border border-border hover:border-border-strong hover:bg-secondary/80',
        variant === 'quiet' && 'text-primary-muted hover:bg-primary-soft',
        href === '/tournament/teams' && 'phone:w-[180px]',
        className,
      )}
      href={href}
    >
      {children}
    </Link>
  );
}

function FormSubmitButton({
  children,
  className,
  stateKey,
}: {
  children: ReactNode;
  className?: string;
  stateKey?: string;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      className={cn(
        'min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold',
        className,
      )}
      disabled={pending}
      size='lg'
      type='submit'
    >
      <AnimatedButtonLabel
        stateKey={pending ? 'pending' : (stateKey ?? 'ready')}
      >
        {pending ? 'Saving...' : children}
      </AnimatedButtonLabel>
    </Button>
  );
}

function DeadlineBanner({
  deadline,
  remaining,
  status,
}: {
  deadline: string;
  remaining?: string;
  status?: 'open' | 'upcoming' | 'passed';
}) {
  const open = status === 'open' || (!status && deadline === 'Open');
  const passed = status === 'passed';

  return (
    <Card
      className={cn(
        'overflow-hidden',
        passed
          ? 'border-danger/25 bg-danger-soft/70'
          : 'border-warning/25 bg-warning-soft/70',
      )}
    >
      <div className='grid gap-4 px-5 py-4 tablet:grid-cols-[auto_minmax(0,1fr)_auto] tablet:items-center desktop:px-6'>
        <span
          className={cn(
            'grid size-11 place-items-center rounded-xl',
            passed ? 'bg-danger/12 text-danger' : 'bg-warning/12 text-warning',
          )}
          aria-hidden='true'
        >
          {passed ? <LockKeyhole size={21} /> : <Clock3 size={21} />}
        </span>
        <div>
          <Kicker className={passed ? 'text-danger' : 'text-warning'}>
            {open
              ? 'REGISTRATION IS OPEN'
              : passed
                ? 'REGISTRATION CLOSED'
                : 'REGISTRATION CLOSES'}
          </Kicker>
          <p className='mt-1.5 text-sm font-semibold text-foreground'>
            {open ? 'The organizer has not set a closing time.' : deadline}
          </p>
        </div>
        <div className='tablet:text-right'>
          <p
            className={cn(
              'm-0 font-display text-xl font-bold',
              passed ? 'text-danger' : 'text-warning',
            )}
          >
            {open ? 'Open' : passed ? 'Closed' : (remaining ?? 'Deadline set')}
          </p>
          <p className='mt-1 text-xs text-secondary-foreground'>
            {open
              ? 'Participant changes remain available'
              : passed
                ? 'Participant changes are locked'
                : 'Participant changes close then'}
          </p>
        </div>
      </div>
    </Card>
  );
}

function RegistrationView({
  tournamentName,
  region,
  deadline,
  deadlineRemaining,
  deadlineStatus,
  registration,
}: {
  tournamentName: string;
  region: string;
  deadline: string;
  deadlineRemaining?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  registration?: TournamentRegistrationData | null;
}) {
  const previewRegistration: TournamentRegistrationData = {
    id: 'preview-registration',
    riotName: 'Jinxed',
    riotTag: '0420',
    currentRank: 'Diamond IV',
    selfAssessedTier: 'T3',
    approvedTier: null,
    tierStatus: 'pending',
    primaryRole: 'Mid',
    secondaryRole: 'Support',
  };
  const initial =
    registration === undefined ? previewRegistration : registration;
  const [selectedTier, setSelectedTier] = useState<Tier>(
    initial?.selfAssessedTier ?? 'T3',
  );
  const [primaryRole, setPrimaryRole] = useState<Role>(
    initial?.primaryRole ?? 'Mid',
  );
  const [secondaryRole, setSecondaryRole] = useState<Role>(
    initial?.secondaryRole ?? 'Support',
  );
  const [editing, setEditing] = useState(false);
  const [submittedValues, setSubmittedValues] =
    useState<TournamentRegistrationData | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    savePlayerRegistration,
    {},
  );
  const submitted = Boolean(state.success && !editing);
  const summary = state.registration ?? submittedValues ?? initial;

  function captureSubmission(event: FormEvent<HTMLFormElement>) {
    if (deadlineStatus === 'passed') {
      event.preventDefault();
      return;
    }

    const data = new FormData(event.currentTarget);
    const riotName = String(data.get('riotName') ?? '').trim();
    const riotTag = String(data.get('riotTag') ?? '').trim();
    const currentRank = String(data.get('currentRank') ?? '').trim();
    setSubmittedValues({
      id: initial?.id ?? 'pending-registration',
      riotName,
      riotTag,
      currentRank,
      selfAssessedTier: selectedTier,
      approvedTier: null,
      tierStatus: 'pending',
      primaryRole,
      secondaryRole,
    });
    setEditing(false);
  }

  if (submitted) {
    return (
      <PageFrame>
        <div className='mx-auto flex max-w-2xl flex-col gap-5'>
          <DeadlineBanner
            deadline={deadline}
            remaining={deadlineRemaining}
            status={deadlineStatus}
          />
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.99)' }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
          >
            <Card className='p-6 text-center desktop:p-10' aria-live='polite'>
              <span
                className={cn(
                  'mx-auto grid size-14 place-items-center rounded-2xl',
                  summary?.tierStatus === 'approved'
                    ? 'bg-success-soft text-success'
                    : 'bg-warning-soft text-warning',
                )}
              >
                {summary?.tierStatus === 'approved' ? (
                  <CheckCircle2 size={26} />
                ) : (
                  <Clock3 size={26} />
                )}
              </span>
              <div className='mt-4'>
                <StatusPill
                  tone={
                    summary?.tierStatus === 'approved' ? 'success' : 'warning'
                  }
                >
                  {summary?.tierStatus === 'approved'
                    ? `${summary.approvedTier} APPROVED`
                    : 'PENDING REVIEW'}
                </StatusPill>
              </div>
              <h1 className='mt-5 font-display text-3xl font-bold tracking-[-0.035em]'>
                {initial ? 'Profile updated' : 'Registration sent'}
              </h1>
              <p className='mx-auto mt-3 max-w-copy text-base leading-6 text-secondary-foreground'>
                {summary?.tierStatus === 'approved'
                  ? `Your ${summary.approvedTier} tier is still approved. You can start looking at teams now.`
                  : `The organizer will review your ${summary?.selfAssessedTier ?? 'selected'} self-assessment. You can start looking at teams now.`}
              </p>
              <div className='mt-6 grid gap-3 rounded-2xl border border-border bg-secondary p-4 text-left tablet:grid-cols-3'>
                <div>
                  <Kicker>RIOT ID</Kicker>
                  <p className='mt-2 text-sm font-semibold'>
                    {summary?.riotName}#{summary?.riotTag}
                  </p>
                </div>
                <div>
                  <Kicker>RANK</Kicker>
                  <p className='mt-2 text-sm font-semibold'>
                    {summary?.currentRank}
                  </p>
                </div>
                <div>
                  <Kicker>ROLES</Kicker>
                  {summary ? (
                    <RolePreference
                      className='mt-2 text-sm font-semibold'
                      primaryRole={summary.primaryRole}
                      secondaryRole={summary.secondaryRole}
                    />
                  ) : null}
                </div>
              </div>
              <div className='mt-6 flex flex-col justify-center gap-3 tablet:flex-row'>
                <ButtonLink href='/tournament'>
                  Go to participant home <ArrowRight size={16} />
                </ButtonLink>
                {deadlineStatus !== 'passed' ? (
                  <Button
                    className='min-h-11 border border-border bg-secondary text-foreground hover:border-border-strong'
                    onClick={() => setEditing(true)}
                    size='lg'
                    type='button'
                  >
                    Edit profile
                  </Button>
                ) : null}
              </div>
            </Card>
          </motion.div>
        </div>
      </PageFrame>
    );
  }

  return (
    <PageFrame>
      <div className='flex flex-col gap-7'>
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <SectionHeading
            detail={`${tournamentName} · ${region}. The organizer confirms the tier used for team limits.`}
            eyebrow={initial ? 'PLAYER PROFILE' : 'PLAYER REGISTRATION'}
            title={
              initial ? 'Your player profile' : 'Create your player profile'
            }
          />
          <div className='flex flex-wrap gap-2'>
            <StatusPill tone={initial?.approvedTier ? 'success' : 'warning'}>
              {initial?.approvedTier
                ? `${initial.approvedTier} APPROVED`
                : 'PENDING REVIEW'}
            </StatusPill>
            <StatusPill
              tone={deadlineStatus === 'passed' ? 'danger' : 'warning'}
            >
              {deadlineStatus === 'passed'
                ? 'CLOSED'
                : (deadlineRemaining ?? 'OPEN')}
            </StatusPill>
          </div>
        </div>

        <div className='grid items-start gap-5 desktop:grid-cols-[minmax(0,1fr)_300px]'>
          <aside className='order-2 flex flex-col gap-5 desktop:sticky desktop:top-24'>
            <Card className='p-5'>
              <Kicker>ACCOUNT</Kicker>
              <div className='mt-4 flex items-center gap-3'>
                <Avatar
                  player={{
                    ...rosterPlayers[2],
                    name: initial?.riotName ?? 'Jinxed',
                    riotId: initial
                      ? `${initial.riotName}#${initial.riotTag}`
                      : 'Jinxed#0420',
                    initial: (initial?.riotName ?? 'J')
                      .slice(0, 1)
                      .toUpperCase(),
                  }}
                />
                <div className='min-w-0'>
                  <p className='m-0 truncate text-sm font-semibold'>
                    {initial
                      ? `${initial.riotName}#${initial.riotTag}`
                      : 'Signed-in player'}
                  </p>
                  <p className='mt-1 text-xs text-muted-foreground'>
                    Private tournament account
                  </p>
                </div>
              </div>
              <div className='mt-4 border-t border-border pt-4'>
                <StatusPill
                  tone={
                    initial?.tierStatus === 'approved' ? 'success' : 'warning'
                  }
                >
                  {initial?.tierStatus === 'approved'
                    ? 'APPROVED'
                    : 'AWAITING REVIEW'}
                </StatusPill>
              </div>
            </Card>
            <Card className='p-5'>
              <Kicker>WHAT HAPPENS NEXT</Kicker>
              <ol className='mt-4 flex list-none flex-col gap-4 p-0'>
                {[
                  'Complete your player details',
                  'Wait for organizer tier approval',
                  'Create or join a team',
                ].map((step, index) => (
                  <li className='flex items-start gap-3' key={step}>
                    <span className='grid size-7 shrink-0 place-items-center rounded-lg border border-border bg-secondary font-mono text-2xs font-bold text-primary-muted'>
                      {index + 1}
                    </span>
                    <p className='m-0 pt-1 text-sm leading-5 text-secondary-foreground'>
                      {step}
                    </p>
                  </li>
                ))}
              </ol>
            </Card>
            <Card
              className={cn(
                'p-5',
                deadlineStatus === 'passed'
                  ? 'border-danger/25 bg-danger-soft'
                  : 'border-warning/25 bg-warning-soft/60',
              )}
            >
              <Kicker
                className={
                  deadlineStatus === 'passed' ? 'text-danger' : 'text-warning'
                }
              >
                {deadlineStatus === 'passed'
                  ? 'REGISTRATION CLOSED'
                  : 'REGISTRATION CLOSES'}
              </Kicker>
              <p className='mt-2 font-display text-lg font-bold'>{deadline}</p>
              <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                {deadlineStatus === 'passed'
                  ? 'Ask the organizer if you need an exception.'
                  : `${deadlineRemaining ?? 'Open'} · edits reopen tier review.`}
              </p>
            </Card>
          </aside>

          <form
            action={formAction}
            className='order-1 flex min-w-0 flex-col gap-5'
            onSubmit={captureSubmission}
          >
            <fieldset
              className='contents'
              disabled={deadlineStatus === 'passed'}
            >
              <Card className='p-5 desktop:p-6'>
                <div className='border-b border-border pb-5'>
                  <Kicker>PLAYER DETAILS</Kicker>
                  <h2 className='mt-2 font-display text-2xl font-bold'>
                    How should friends find you?
                  </h2>
                  <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                    Use the Riot ID and rank you play with today.
                  </p>
                </div>
                <FieldGroup className='mt-6 tablet:grid tablet:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='riotName'>Riot name</FieldLabel>
                    <Input
                      className='min-h-12 rounded-xl px-3.5 text-base'
                      defaultValue={initial?.riotName ?? ''}
                      id='riotName'
                      name='riotName'
                      placeholder='Your Riot name'
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='riotTag'>Riot tag</FieldLabel>
                    <div className='relative'>
                      <span
                        aria-hidden='true'
                        className='pointer-events-none absolute inset-y-0 left-3.5 flex items-center text-base font-semibold text-muted-foreground'
                      >
                        #
                      </span>
                      <Input
                        className='min-h-12 rounded-xl pr-3.5 pl-7 text-base'
                        defaultValue={initial?.riotTag ?? ''}
                        id='riotTag'
                        name='riotTag'
                        placeholder='EUW'
                        required
                      />
                    </div>
                  </Field>
                  <Field className='tablet:col-span-2'>
                    <FieldLabel htmlFor='currentRank'>Current rank</FieldLabel>
                    <FieldDescription>
                      Choose the rank shown in Wild Rift today.
                    </FieldDescription>
                    <NativeSelect
                      className='w-full'
                      defaultValue={initial?.currentRank ?? ''}
                      id='currentRank'
                      name='currentRank'
                    >
                      <NativeSelectOption>Challenger</NativeSelectOption>
                      <NativeSelectOption>Grandmaster</NativeSelectOption>
                      <NativeSelectOption>Master</NativeSelectOption>
                      <NativeSelectOption>Diamond I</NativeSelectOption>
                      <NativeSelectOption>Diamond II</NativeSelectOption>
                      <NativeSelectOption>Diamond III</NativeSelectOption>
                      <NativeSelectOption>Diamond IV</NativeSelectOption>
                      <NativeSelectOption>Emerald I</NativeSelectOption>
                      <NativeSelectOption>Emerald II</NativeSelectOption>
                      <NativeSelectOption>Emerald III</NativeSelectOption>
                      <NativeSelectOption>Emerald IV</NativeSelectOption>
                      <NativeSelectOption>Platinum or below</NativeSelectOption>
                    </NativeSelect>
                  </Field>
                </FieldGroup>

                <fieldset className='mt-7 border-t border-border pt-6'>
                  <legend className='text-sm font-semibold'>
                    Self-assessed tier
                  </legend>
                  <FieldDescription className='mt-1'>
                    Use the default mapping. The organizer makes the final call.
                  </FieldDescription>
                  <RadioGroup
                    className='mt-4 grid gap-3 tablet:grid-cols-2'
                    name='selfAssessedTier'
                    onValueChange={(value) => setSelectedTier(value as Tier)}
                    value={selectedTier}
                  >
                    {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                      <label
                        className={cn(
                          'flex min-h-17 cursor-pointer items-center gap-3 rounded-xl border bg-secondary p-3.5 has-[:focus-visible]:border-primary has-[:focus-visible]:ring-3 has-[:focus-visible]:ring-primary/20',
                          selectedTier === tier
                            ? 'border-primary bg-primary-soft'
                            : 'border-border hover:border-border-strong',
                        )}
                        htmlFor={`self-tier-${tier}`}
                        key={tier}
                      >
                        <RadioGroupItem
                          className='sr-only'
                          id={`self-tier-${tier}`}
                          value={tier}
                        />
                        <TierBadge tier={tier} />
                        <span className='text-sm font-medium text-secondary-foreground'>
                          {tierMeta[tier].range}
                        </span>
                        <span
                          className={cn(
                            'ml-auto grid size-5 place-items-center rounded-full border',
                            selectedTier === tier
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-border',
                          )}
                        >
                          <AnimatePresence initial={false} mode='wait'>
                            {selectedTier === tier ? (
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

                <FieldGroup className='mt-7 grid gap-5 border-t border-border pt-6 tablet:grid-cols-2'>
                  <Field>
                    <FieldLabel htmlFor='primaryRole'>
                      <RoleIcon className='size-4' roleName={primaryRole} />
                      Primary role
                    </FieldLabel>
                    <NativeSelect
                      className='w-full'
                      id='primaryRole'
                      name='primaryRole'
                      onChange={(event) => {
                        const nextRole = event.target.value as Role;
                        setPrimaryRole(nextRole);
                        if (nextRole === secondaryRole)
                          setSecondaryRole(
                            starterSlots.find((role) => role !== nextRole) ??
                              'Baron',
                          );
                      }}
                      value={primaryRole}
                    >
                      {starterSlots.map((role) => (
                        <NativeSelectOption key={role}>
                          {role}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='secondaryRole'>
                      <RoleIcon className='size-4' roleName={secondaryRole} />
                      Secondary role
                    </FieldLabel>
                    <NativeSelect
                      className='w-full'
                      id='secondaryRole'
                      name='secondaryRole'
                      onChange={(event) =>
                        setSecondaryRole(event.target.value as Role)
                      }
                      value={secondaryRole}
                    >
                      {starterSlots.map((role) => (
                        <NativeSelectOption
                          disabled={role === primaryRole}
                          key={role}
                        >
                          {role}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                </FieldGroup>

                <div className='mt-7 flex flex-col gap-3 border-t border-border pt-6 tablet:flex-row tablet:items-center tablet:justify-between'>
                  <p className='m-0 max-w-md text-xs leading-5 text-muted-foreground'>
                    You can edit rank, tier, and roles until registration
                    closes. Changes reopen organizer review.
                  </p>
                  <FormSubmitButton className='shrink-0 bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'>
                    {initial ? 'Save profile' : 'Send for review'}{' '}
                    <ArrowRight size={16} />
                  </FormSubmitButton>
                </div>
                {state.error ? (
                  <Alert
                    className='mt-4'
                    aria-live='polite'
                    variant='destructive'
                  >
                    <AlertDescription>{state.error}</AlertDescription>
                  </Alert>
                ) : null}
              </Card>

              <Card className='overflow-hidden'>
                <div className='border-b border-border p-5 desktop:p-6'>
                  <Kicker>DEFAULT TIER MAP</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Rank ranges
                  </h2>
                </div>
                <div className='grid tablet:grid-cols-2'>
                  {(Object.keys(tierMeta) as Tier[]).map((tier) => (
                    <div
                      className='flex items-center gap-3 border-b border-border p-4 last:border-0 tablet:odd:border-r'
                      key={tier}
                    >
                      <TierBadge tier={tier} />
                      <p className='m-0 text-sm font-medium text-secondary-foreground'>
                        {tierMeta[tier].range}
                      </p>
                    </div>
                  ))}
                </div>
                <p className='m-0 border-t border-border bg-secondary px-5 py-4 text-xs leading-5 text-muted-foreground'>
                  Tier limits apply to the full roster, including substitutes:
                  at most one T1 and two T2 players.
                </p>
              </Card>
            </fieldset>
          </form>
        </div>
      </div>
    </PageFrame>
  );
}

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

function CreateTeamView({
  deadlineStatus,
  incomingInvites = [],
}: {
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  incomingInvites?: TournamentIncomingInviteData[];
}) {
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    createTeam,
    {},
  );
  const [inviteState, inviteAction] = useActionState<
    TournamentActionState,
    FormData
  >(respondToTeamInvite, {});
  const changesClosed = deadlineStatus === 'passed';

  return (
    <PageFrame>
      <div className='mx-auto flex max-w-2xl flex-col gap-6'>
        <SectionHeading
          detail='Start a draft roster, become its captain, and invite friends to fill the seven available places.'
          eyebrow='TEAM ROOM'
          title='Create your team'
        />
        {changesClosed ? (
          <Alert className='border-danger/30 bg-danger-soft text-danger'>
            <AlertDescription className='text-danger'>
              Team creation and invitation decisions are closed because the
              registration deadline has passed.
            </AlertDescription>
          </Alert>
        ) : null}
        {incomingInvites.length > 0 ? (
          <Card className='p-5 desktop:p-6'>
            <div className='flex flex-wrap items-start justify-between gap-3'>
              <div>
                <Kicker>TEAM INVITATIONS</Kicker>
                <h2 className='mt-2 font-display text-xl font-bold'>
                  Friends want you on their roster
                </h2>
              </div>
              <StatusPill tone='warning'>
                {incomingInvites.length} WAITING
              </StatusPill>
            </div>
            <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
              {incomingInvites.map((invite) => (
                <div
                  className='rounded-2xl border border-primary/30 bg-primary-soft p-4'
                  key={invite.id}
                >
                  <Kicker className='text-primary-muted'>TEAM INVITE</Kicker>
                  <p className='mt-2 text-base font-semibold'>
                    {invite.teamName}
                  </p>
                  <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                    Captain {invite.captainName} · {invite.captainRiotId}
                  </p>
                  {!changesClosed ? (
                    <form action={inviteAction} className='mt-4 flex gap-2'>
                      <input name='inviteId' type='hidden' value={invite.id} />
                      <Button
                        className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                        name='decision'
                        size='lg'
                        type='submit'
                        value='accepted'
                      >
                        Accept
                      </Button>
                      <Button
                        className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                        name='decision'
                        size='lg'
                        type='submit'
                        value='declined'
                      >
                        Decline
                      </Button>
                    </form>
                  ) : (
                    <p className='mt-3 text-xs text-muted-foreground'>
                      This invitation can no longer be changed.
                    </p>
                  )}
                </div>
              ))}
            </div>
            {inviteState.error ? (
              <Alert aria-live='polite' className='mt-4' variant='destructive'>
                <AlertDescription>{inviteState.error}</AlertDescription>
              </Alert>
            ) : null}
            {inviteState.success ? (
              <Alert
                aria-live='polite'
                className='mt-4 border-success/30 bg-success-soft text-success'
              >
                <AlertDescription className='text-success'>
                  {inviteState.success}
                </AlertDescription>
              </Alert>
            ) : null}
          </Card>
        ) : null}
        <Card className='p-5 desktop:p-6'>
          <form action={formAction} className='flex flex-col gap-5'>
            <fieldset className='contents' disabled={changesClosed}>
              <Field>
                <FieldLabel htmlFor='teamName'>Team name</FieldLabel>
                <Input
                  className='min-h-12 rounded-xl px-3.5 text-base'
                  id='teamName'
                  name='teamName'
                  placeholder='Night Sentinels'
                  required
                />
                <FieldDescription>
                  You can rename a draft team later as captain.
                </FieldDescription>
              </Field>
              {state.error ? (
                <Alert aria-live='polite' variant='destructive'>
                  <AlertDescription>{state.error}</AlertDescription>
                </Alert>
              ) : null}
              {state.success ? (
                <motion.div
                  animate={{
                    opacity: 1,
                    transform: 'translateY(0px) scale(1)',
                  }}
                  aria-live='polite'
                  className='rounded-xl'
                  initial={{
                    opacity: 0,
                    transform: 'translateY(8px) scale(0.99)',
                  }}
                  transition={{ duration: 0.22, ease: easeOutExpo }}
                >
                  <Alert
                    className='border-success/30 bg-success-soft text-success'
                    aria-live='polite'
                  >
                    <AlertDescription className='text-success'>
                      {state.success}
                    </AlertDescription>
                  </Alert>
                  <ButtonLink className='mt-4' href='/tournament/team'>
                    Open team room <ArrowRight size={16} />
                  </ButtonLink>
                </motion.div>
              ) : (
                <FormSubmitButton className='self-start bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover'>
                  <Plus size={17} /> Create team
                </FormSubmitButton>
              )}
            </fieldset>
          </form>
        </Card>
      </div>
    </PageFrame>
  );
}

function RegistrationRequiredTeamView() {
  return (
    <PageFrame>
      <div className='mx-auto flex max-w-2xl flex-col gap-6'>
        <SectionHeading
          detail='Complete your player profile before creating or joining a team. You can still browse the current drafts first.'
          eyebrow='TEAM ROOM'
          title='Finish your registration'
        />
        <Card className='p-6 desktop:p-8'>
          <StatusPill tone='warning'>REGISTRATION REQUIRED</StatusPill>
          <h2 className='mt-4 font-display text-2xl font-bold'>
            Your player details come first
          </h2>
          <p className='mt-2 text-sm leading-6 text-secondary-foreground'>
            The organizer needs your Riot ID, rank, tier, and role preferences
            before you can hold a roster spot.
          </p>
          <div className='mt-6 flex flex-col gap-3 phone:flex-row'>
            <ButtonLink href='/tournament/register'>
              Complete profile <ArrowRight size={16} />
            </ButtonLink>
            <ButtonLink href='/tournament/teams' variant='secondary'>
              Browse teams
            </ButtonLink>
          </div>
        </Card>
      </div>
    </PageFrame>
  );
}

function LineupMoveMenu({
  assignment,
  assignments,
  members,
  onArrange,
  onClose,
  desktopPlacement = 'right',
}: {
  assignment: LineupAssignment;
  assignments: LineupAssignment[];
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onClose: () => void;
  desktopPlacement?: 'left' | 'right';
}) {
  const memberName = (registrationId: string) =>
    members.find((member) => member.registrationId === registrationId)
      ?.displayName ?? 'Player';
  const substitutes = assignments.filter(
    (entry) => entry.lineupPosition === 'substitute',
  );
  const choose = (target: LineupDropTarget) => {
    onArrange(assignment.registrationId, target);
    onClose();
  };

  return (
    <motion.div
      animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
      aria-label={`Move ${memberName(assignment.registrationId)}`}
      className={cn(
        'absolute top-[calc(100%+10px)] right-0 z-50 w-[min(296px,calc(100vw-2rem))] origin-top-right overflow-hidden rounded-xl border border-border-strong bg-background shadow-2xl shadow-background/60',
        desktopPlacement === 'left' &&
          'desktop:left-0 desktop:right-auto desktop:origin-top-left',
      )}
      data-lineup-move-menu
      exit={{ opacity: 0, transform: 'translateY(-4px) scale(0.98)' }}
      initial={{ opacity: 0, transform: 'translateY(-4px) scale(0.98)' }}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          onClose();
        }
      }}
      role='menu'
      transition={{ duration: 0.18, ease: easeOutExpo }}
    >
      <div className='flex items-start justify-between gap-3 bg-secondary px-4 py-3'>
        <div>
          <Kicker className='text-primary'>
            MOVE {memberName(assignment.registrationId).toUpperCase()}
          </Kicker>
          <p className='mt-1 text-xs font-medium text-foreground'>
            Choose a new position
          </p>
        </div>
        <button
          aria-label='Close move menu'
          className='grid size-8 shrink-0 place-items-center rounded-md text-muted-foreground transition-[background-color,color,transform] duration-150 ease-out-quad hover:bg-background/60 hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring active:scale-[0.97] motion-reduce:active:scale-100'
          onClick={onClose}
          type='button'
        >
          <X aria-hidden='true' size={16} />
        </button>
      </div>
      <div className='border-t border-border px-2.5 py-2.5'>
        <Kicker className='px-2 text-[8px] tracking-[0.12em]'>
          CHOOSE DESTINATION
        </Kicker>
        <div className='mt-1.5 grid gap-1'>
          {starterSlots.map((role) => {
            const occupant = assignments.find(
              (entry) =>
                entry.lineupPosition === 'starter' &&
                entry.starterRole === role,
            );
            const current =
              occupant?.registrationId === assignment.registrationId;
            const occupiedByOther = Boolean(
              occupant && occupant.registrationId !== assignment.registrationId,
            );
            return (
              <button
                aria-current={current ? 'true' : undefined}
                className={cn(
                  'flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left transition-[background-color,border-color,color,transform] duration-150 ease-out-quad focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100',
                  current
                    ? 'cursor-default bg-background/60 text-muted-foreground'
                    : 'text-secondary-foreground hover:bg-secondary hover:text-foreground',
                )}
                disabled={current}
                key={role}
                onClick={() =>
                  choose(
                    occupiedByOther && occupant
                      ? {
                          kind: 'player',
                          registrationId: occupant.registrationId,
                        }
                      : { kind: 'starter', role },
                  )
                }
                role='menuitem'
                type='button'
              >
                <span className='flex min-w-0 items-center gap-2.5'>
                  <RoleIcon
                    className={cn(
                      'size-5',
                      current ? 'text-primary' : 'text-muted-foreground',
                    )}
                    roleName={role}
                  />
                  <span className='truncate text-xs font-medium'>{role}</span>
                </span>
                <span
                  className={cn(
                    'shrink-0 font-mono text-[8px] font-bold tracking-[0.08em]',
                    current ? 'text-muted-foreground' : 'text-primary-muted',
                  )}
                >
                  {current
                    ? 'CURRENT'
                    : occupiedByOther && occupant
                      ? `SWAP · ${memberName(occupant.registrationId).toUpperCase()}`
                      : 'MOVE'}
                </span>
              </button>
            );
          })}
          {assignment.lineupPosition === 'starter' && substitutes.length < 2 ? (
            <button
              className='flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-secondary-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out-quad hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100'
              onClick={() => choose({ kind: 'substitute' })}
              role='menuitem'
              type='button'
            >
              <span className='flex items-center gap-2.5'>
                <span className='grid size-5 place-items-center rounded-md bg-secondary text-muted-foreground'>
                  <Users aria-hidden='true' size={13} />
                </span>
                <span className='text-xs font-medium'>Substitute</span>
              </span>
              <span className='font-mono text-[8px] font-bold tracking-[0.08em] text-primary-muted'>
                MOVE
              </span>
            </button>
          ) : null}
          {assignment.lineupPosition === 'starter' && substitutes.length === 2
            ? substitutes.map((substitute) => (
                <button
                  className='flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-2.5 text-left text-secondary-foreground transition-[background-color,border-color,color,transform] duration-150 ease-out-quad hover:bg-secondary hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-ring active:scale-[0.99] motion-reduce:active:scale-100'
                  key={substitute.registrationId}
                  onClick={() =>
                    choose({
                      kind: 'player',
                      registrationId: substitute.registrationId,
                    })
                  }
                  role='menuitem'
                  type='button'
                >
                  <span className='flex items-center gap-2.5'>
                    <span className='grid size-5 place-items-center rounded-md bg-secondary text-muted-foreground'>
                      <Users aria-hidden='true' size={13} />
                    </span>
                    <span className='text-xs font-medium'>
                      {memberName(substitute.registrationId)}
                    </span>
                  </span>
                  <span className='font-mono text-[8px] font-bold tracking-[0.08em] text-primary-muted'>
                    SWAP
                  </span>
                </button>
              ))
            : null}
        </div>
      </div>
      {assignment.lineupPosition === 'starter' && substitutes.length > 0 ? (
        <div className='border-t border-border px-2.5 py-2.5'>
          <Kicker className='px-2 text-[8px] tracking-[0.12em]'>
            SWAP WITH A PLAYER
          </Kicker>
          <div className='mt-1.5 rounded-lg border border-border bg-secondary/70 px-2.5 py-2'>
            <p className='m-0 flex items-start gap-2 text-[10px] leading-4 text-secondary-foreground'>
              <Info
                aria-hidden='true'
                className='mt-0.5 shrink-0 text-primary'
                size={13}
              />
              Occupied slots become swaps automatically.
            </p>
          </div>
        </div>
      ) : null}
      <div className='border-t border-border bg-background/60 px-4 py-2.5'>
        <p className='m-0 text-[10px] leading-4 text-muted-foreground'>
          Changes remain draft until you save the lineup.
        </p>
      </div>
    </motion.div>
  );
}

function LineupPlayerCard({
  assignment,
  assignments,
  member,
  members,
  onArrange,
  onDragStateChange,
  canEdit,
  moveMenuOpen,
  onToggleMoveMenu,
  onCloseMoveMenu,
  isSwapParticipant,
  swapAnimationKey,
  variant,
  role,
}: {
  assignment: LineupAssignment;
  assignments: LineupAssignment[];
  member: TournamentMemberData;
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onDragStateChange: (registrationId: string, active: boolean) => void;
  canEdit: boolean;
  moveMenuOpen: boolean;
  onToggleMoveMenu: () => void;
  onCloseMoveMenu: () => void;
  isSwapParticipant: boolean;
  swapAnimationKey: number | null;
  variant: 'starter' | 'substitute';
  role?: Role;
}) {
  const player = playerFromMember(member);
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const [isDragging, setIsDragging] = useState(false);
  const isStarter = variant === 'starter';

  const startDrag = (event: ReactPointerEvent<HTMLDivElement>) => {
    if (!canEdit) return;
    dragControls.start(event);
  };

  return (
    <motion.div
      className={cn(
        'relative select-none border border-border bg-secondary shadow-sm',
        isStarter
          ? 'flex min-h-23 flex-col justify-between gap-3 rounded-[11px] p-3.25'
          : 'flex min-h-13 items-center gap-3 rounded-[10px] px-2.5 py-2',
        isDragging && 'border-primary/70 shadow-xl shadow-background/50',
      )}
      drag={canEdit}
      dragControls={dragControls}
      dragElastic={0.06}
      dragListener={false}
      dragMomentum={false}
      dragSnapToOrigin
      layout={canEdit && !shouldReduceMotion}
      onDragEnd={(_, info) => {
        setIsDragging(false);
        onDragStateChange(assignment.registrationId, false);
        const target = lineupDropTargetAtPoint(info.point);
        if (target) onArrange(assignment.registrationId, target);
      }}
      onDragStart={() => {
        setIsDragging(true);
        onDragStateChange(assignment.registrationId, true);
      }}
      style={{
        borderRadius: isStarter ? 11 : 10,
        pointerEvents: isDragging ? 'none' : 'auto',
        zIndex: isDragging ? 30 : moveMenuOpen ? 60 : 1,
      }}
      transition={
        shouldReduceMotion
          ? { duration: 0 }
          : { layout: { type: 'spring', duration: 0.36, bounce: 0.08 } }
      }
      whileDrag={shouldReduceMotion ? undefined : { scale: 1.02 }}
    >
      {isSwapParticipant && swapAnimationKey !== null ? (
        <motion.div
          animate={
            shouldReduceMotion
              ? { opacity: [0, 0.72, 0] }
              : {
                  opacity: [0, 1, 0],
                  transform: ['scale(0.96)', 'scale(1.01)', 'scale(1)'],
                }
          }
          aria-hidden='true'
          className='pointer-events-none absolute inset-0 z-10 border-2 border-primary bg-primary/5'
          initial={
            shouldReduceMotion
              ? { opacity: 0 }
              : { opacity: 0, transform: 'scale(0.96)' }
          }
          key={`swap-pulse-${swapAnimationKey}`}
          style={{ borderRadius: isStarter ? 11 : 10 }}
          transition={{ duration: 0.34, ease: easeOutExpo }}
        />
      ) : null}
      <div
        className={cn(
          'min-w-0 touch-none cursor-grab active:cursor-grabbing',
          isStarter
            ? 'flex items-start justify-between gap-2'
            : 'flex flex-1 items-center gap-3',
        )}
        onPointerDown={startDrag}
        title={canEdit ? `Drag ${player.name} to change position` : undefined}
      >
        <div
          className={cn(
            'flex min-w-0 items-center',
            isStarter ? 'gap-2' : 'gap-3',
          )}
        >
          {isStarter && role ? (
            <RoleIcon
              className={cn(
                'size-5',
                role === assignment.starterRole
                  ? 'text-role-icon'
                  : 'text-muted-foreground',
              )}
              roleName={role}
            />
          ) : null}
          {!isStarter ? <Avatar player={player} size='size-7' /> : null}
          {canEdit ? (
            <GripVertical
              aria-hidden='true'
              className='shrink-0 text-muted-foreground hover:text-primary focus-visible:text-primary'
              size={15}
              strokeWidth={1.8}
            />
          ) : null}
          <div className='min-w-0'>
            <p
              className={cn(
                'm-0 truncate font-semibold text-foreground',
                isStarter ? 'text-sm' : 'text-xs',
              )}
              title={player.name}
            >
              {player.name}
              {player.isCaptain ? (
                <span className='ml-1 text-[9px] font-medium text-primary-muted'>
                  captain
                </span>
              ) : null}
            </p>
            <div className='mt-1 flex items-center gap-1.5 text-[9px] text-muted-foreground'>
              <span>{player.tier}</span>
              <span aria-hidden='true'>·</span>
              <RoleIcon
                className='size-3 text-muted-foreground'
                roleName={player.primaryRole}
              />
              <span className='sr-only'>Primary role {player.primaryRole}</span>
              <RoleIcon
                className='size-3 text-muted-foreground'
                roleName={player.secondaryRole}
              />
              <span className='sr-only'>
                Secondary role {player.secondaryRole}
              </span>
            </div>
          </div>
        </div>
        {isStarter ? (
          <span className='shrink-0 font-mono text-[8px] font-bold tracking-[0.08em] text-success'>
            STARTER
          </span>
        ) : null}
      </div>
      {canEdit ? (
        <div
          className={cn(
            'relative shrink-0',
            isStarter ? 'self-end' : 'ml-auto',
          )}
        >
          <Button
            aria-expanded={moveMenuOpen}
            aria-haspopup='menu'
            className='min-h-9 gap-1.5 rounded-md border border-border-strong bg-background/25 px-2 text-[10px] text-foreground hover:border-primary/60 hover:bg-background/60 hover:text-foreground desktop:min-h-8'
            data-lineup-move-trigger
            onClick={(event) => {
              event.stopPropagation();
              onToggleMoveMenu();
            }}
            size='sm'
            type='button'
          >
            <ArrowLeftRight aria-hidden='true' size={13} />
            <span>Move</span>
          </Button>
          <AnimatePresence initial={false}>
            {moveMenuOpen ? (
              <LineupMoveMenu
                assignment={assignment}
                assignments={assignments}
                desktopPlacement={
                  isStarter && role !== 'Support' ? 'left' : 'right'
                }
                members={members}
                onArrange={onArrange}
                onClose={onCloseMoveMenu}
              />
            ) : null}
          </AnimatePresence>
        </div>
      ) : null}
    </motion.div>
  );
}

function LineupRoleSlot({
  assignment,
  activeRegistrationId,
  assignments,
  canEdit,
  member,
  members,
  onArrange,
  onDragStateChange,
  onCloseMoveMenu,
  onToggleMoveMenu,
  moveMenuRegistrationId,
  isSwapParticipant,
  swapAnimationKey,
  role,
}: {
  assignment?: LineupAssignment;
  activeRegistrationId: string | null;
  assignments: LineupAssignment[];
  canEdit: boolean;
  member?: TournamentMemberData;
  members: TournamentMemberData[];
  onArrange: (registrationId: string, target: LineupDropTarget) => void;
  onDragStateChange: (registrationId: string, active: boolean) => void;
  onCloseMoveMenu: () => void;
  onToggleMoveMenu: () => void;
  moveMenuRegistrationId: string | null;
  isSwapParticipant: boolean;
  swapAnimationKey: number | null;
  role: Role;
}) {
  const activeDrop = Boolean(
    activeRegistrationId && activeRegistrationId !== assignment?.registrationId,
  );

  if (!assignment || !member) {
    return (
      <ShadcnCard
        className={cn(
          'flex min-h-[92px] select-none flex-col justify-between rounded-[11px] border bg-background/15 p-[13px] text-left ring-0 transition-[background-color,border-color,transform] duration-200 ease-out-quad desktop:min-h-[92px]',
          activeDrop
            ? 'border-primary/70 bg-primary/5'
            : 'border-border-strong',
        )}
        data-lineup-drop-kind='starter'
        data-lineup-role={role}
        role='article'
      >
        <div className='flex items-start justify-between gap-2'>
          <RoleIcon className='size-5 text-muted-foreground' roleName={role} />
          <span className='font-mono text-[8px] text-muted-foreground'>
            OPEN
          </span>
        </div>
        <p className='m-0 text-sm font-semibold text-secondary-foreground'>
          Drop player here
        </p>
        <span className='sr-only'>{role} starter slot is open</span>
      </ShadcnCard>
    );
  }

  return (
    <ShadcnCard
      className={cn(
        'relative min-h-[92px] select-none overflow-visible rounded-[11px] border bg-secondary p-0 ring-0 transition-[background-color,border-color,transform] duration-200 ease-out-quad',
        activeDrop ? 'border-primary/70 bg-primary/5' : 'border-border-strong',
      )}
      data-lineup-drop-kind='starter'
      data-lineup-role={role}
      role='article'
    >
      <div
        className='h-full'
        data-lineup-drop-kind='player'
        data-registration-id={assignment.registrationId}
      >
        <LineupPlayerCard
          assignment={assignment}
          assignments={assignments}
          canEdit={canEdit}
          member={member}
          members={members}
          moveMenuOpen={moveMenuRegistrationId === assignment.registrationId}
          onArrange={onArrange}
          onCloseMoveMenu={onCloseMoveMenu}
          onDragStateChange={onDragStateChange}
          onToggleMoveMenu={onToggleMoveMenu}
          isSwapParticipant={isSwapParticipant}
          swapAnimationKey={swapAnimationKey}
          role={role}
          variant='starter'
        />
      </div>
    </ShadcnCard>
  );
}

function LineupEditor({
  team,
  currentRegistrationId,
  deadlineStatus,
  onAssignmentsChange,
  className,
  preview = false,
}: {
  team: TournamentTeamData;
  currentRegistrationId?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
  onAssignmentsChange?: (assignments: LineupAssignment[]) => void;
  className?: string;
  preview?: boolean;
}) {
  const captain = team.members.some(
    (member) =>
      member.registrationId === currentRegistrationId && member.isCaptain,
  );
  const canEdit =
    preview ||
    (captain && team.status === 'draft' && deadlineStatus !== 'passed');
  const [draftAssignments, setDraftAssignments] = useState<LineupAssignment[]>(
    team.members.map((member) => ({
      registrationId: member.registrationId,
      lineupPosition: member.lineupPosition,
      starterRole: member.starterRole,
    })),
  );
  const assignments = reconcileLineupAssignments(
    draftAssignments,
    team.members,
  );
  const [activeRegistrationId, setActiveRegistrationId] = useState<
    string | null
  >(null);
  const [moveMenuRegistrationId, setMoveMenuRegistrationId] = useState<
    string | null
  >(null);
  const [moveMessage, setMoveMessage] = useState('');
  const [previewSaveMessage, setPreviewSaveMessage] = useState('');
  const [swapAnimation, setSwapAnimation] = useState<{
    registrationIds: string[];
    key: number;
  } | null>(null);
  const [state, formAction] = useActionState<TournamentActionState, FormData>(
    updateTeamLineup,
    {},
  );
  const substitutes = assignments.filter(
    (assignment) => assignment.lineupPosition === 'substitute',
  );
  const starterCount = assignments.filter(
    (assignment) => assignment.lineupPosition === 'starter',
  ).length;
  const displayedMembers = team.members.map((member) => {
    const assignment = assignments.find(
      (candidate) => candidate.registrationId === member.registrationId,
    );
    return assignment
      ? {
          ...member,
          lineupPosition: assignment.lineupPosition,
          starterRole: assignment.starterRole,
        }
      : member;
  });
  const validation = validateRoster(displayedMembers);
  const blockingIssueCount = validation.blockingIssues.filter(
    (issue) => !issue.toLowerCase().startsWith('add '),
  ).length;

  useEffect(() => {
    if (!moveMenuRegistrationId) return;
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Element | null;
      if (
        target?.closest('[data-lineup-move-trigger]') ||
        target?.closest('[data-lineup-move-menu]')
      ) {
        return;
      }
      setMoveMenuRegistrationId(null);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () =>
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [moveMenuRegistrationId]);

  const arrange = (registrationId: string, target: LineupDropTarget) => {
    if (!canEdit) return;
    const next = arrangeLineupAssignments(assignments, registrationId, target);
    if (next === assignments) return;
    const targetAssignment =
      target.kind === 'player'
        ? assignments.find(
            (assignment) => assignment.registrationId === target.registrationId,
          )
        : target.kind === 'starter'
          ? assignments.find(
              (assignment) =>
                assignment.lineupPosition === 'starter' &&
                assignment.starterRole === target.role,
            )
          : undefined;
    setDraftAssignments(next);
    onAssignmentsChange?.(next);
    const isSwap = Boolean(
      targetAssignment && targetAssignment.registrationId !== registrationId,
    );
    setSwapAnimation((current) => {
      if (!isSwap || !targetAssignment) {
        return null;
      }
      return {
        registrationIds: [registrationId, targetAssignment.registrationId],
        key: (current?.key ?? 0) + 1,
      };
    });
    const playerName = team.members.find(
      (member) => member.registrationId === registrationId,
    )?.displayName;
    const targetName = targetAssignment
      ? team.members.find(
          (member) => member.registrationId === targetAssignment.registrationId,
        )?.displayName
      : null;
    setMoveMessage(
      target.kind === 'starter'
        ? isSwap
          ? `${playerName ?? 'Player'} swapped with ${targetName ?? 'the selected player'}. Save to keep this arrangement.`
          : `${playerName ?? 'Player'} moved to ${target.role}. Save to keep this arrangement.`
        : target.kind === 'player'
          ? `${playerName ?? 'Player'} swapped with ${targetName ?? 'the selected player'}. Save to keep this arrangement.`
          : `${playerName ?? 'Player'} moved to substitute. Save to keep this arrangement.`,
    );
    setMoveMenuRegistrationId(null);
  };

  const memberFor = (assignment?: LineupAssignment) =>
    assignment
      ? team.members.find(
          (member) => member.registrationId === assignment.registrationId,
        )
      : undefined;

  const renderSubstitute = (assignment: LineupAssignment) => {
    const member = memberFor(assignment);
    if (!member) return null;
    return (
      <div
        className={cn(
          'relative min-w-0 flex-1',
          activeRegistrationId &&
            activeRegistrationId !== assignment.registrationId &&
            'rounded-[10px] ring-1 ring-primary/60',
        )}
        data-lineup-drop-kind='player'
        data-registration-id={assignment.registrationId}
        key={assignment.registrationId}
      >
        <LineupPlayerCard
          assignment={assignment}
          assignments={assignments}
          canEdit={canEdit}
          isSwapParticipant={Boolean(
            swapAnimation?.registrationIds.includes(assignment.registrationId),
          )}
          member={member}
          members={team.members}
          moveMenuOpen={moveMenuRegistrationId === assignment.registrationId}
          onArrange={arrange}
          onCloseMoveMenu={() => setMoveMenuRegistrationId(null)}
          onDragStateChange={(registrationId, active) =>
            setActiveRegistrationId(active ? registrationId : null)
          }
          onToggleMoveMenu={() =>
            setMoveMenuRegistrationId((current) =>
              current === assignment.registrationId
                ? null
                : assignment.registrationId,
            )
          }
          swapAnimationKey={swapAnimation?.key ?? null}
          variant='substitute'
        />
      </div>
    );
  };

  return (
    <Card
      aria-labelledby='starting-lineup-heading'
      className={cn(
        'relative select-none overflow-visible bg-card p-[14px] desktop:p-[18px]',
        className,
      )}
      id='starting-lineup-card'
    >
      <div className='flex items-start justify-between gap-3'>
        <div>
          <Kicker>STARTING LINEUP</Kicker>
          <h2
            className='mt-1 font-display text-lg font-bold desktop:text-[18px]'
            id='starting-lineup-heading'
          >
            Five assigned roles
          </h2>
        </div>
        <span className='font-mono text-xs text-secondary-foreground'>
          {starterCount} / 5
          <span className='hidden desktop:inline'> starters</span>
        </span>
      </div>

      {canEdit ? (
        <div className='mt-3 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/35 px-2.5 py-2 text-[11px] text-secondary-foreground'>
          <span className='flex min-w-0 items-center gap-2'>
            <GripVertical
              aria-hidden='true'
              className='shrink-0 text-primary'
              size={15}
            />
            <span>Drag a player card, or use Move to choose a role</span>
          </span>
          <span className='hidden shrink-0 font-mono text-[8px] font-bold tracking-[0.1em] text-primary desktop:inline'>
            CAPTAIN CONTROL
          </span>
        </div>
      ) : (
        <p className='mt-3 rounded-lg border border-border bg-background/35 px-2.5 py-2 text-[11px] text-muted-foreground'>
          {team.status === 'submitted'
            ? 'This roster is locked for participant editing.'
            : deadlineStatus === 'passed'
              ? 'Roster changes closed with registration.'
              : 'Only the team captain can arrange this lineup.'}
        </p>
      )}

      {blockingIssueCount > 0 ? (
        <div className='mt-3 flex items-center justify-between gap-4 text-[11px]'>
          <span className='flex items-center gap-2 font-semibold text-danger'>
            <AlertTriangle aria-hidden='true' size={15} />
            Invalid roster · {blockingIssueCount} blockers
          </span>
          <span className='hidden text-muted-foreground desktop:inline'>
            5 named roles must be filled before submission
          </span>
        </div>
      ) : null}

      <form
        action={preview ? undefined : formAction}
        className='mt-3'
        onSubmit={
          preview
            ? (event) => {
                event.preventDefault();
                setPreviewSaveMessage('Lineup saved to the draft.');
              }
            : undefined
        }
      >
        {canEdit ? (
          <>
            <input name='teamId' type='hidden' value={team.id} />
            <input
              name='lineup'
              type='hidden'
              value={JSON.stringify(assignments)}
            />
          </>
        ) : null}
        <LayoutGroup id={`lineup-${team.id}`}>
          <div className='grid gap-2 desktop:grid-cols-5'>
            {starterSlots.map((role) => {
              const assignment = assignments.find(
                (entry) =>
                  entry.lineupPosition === 'starter' &&
                  entry.starterRole === role,
              );
              return (
                <LineupRoleSlot
                  activeRegistrationId={activeRegistrationId}
                  assignment={assignment}
                  assignments={assignments}
                  canEdit={canEdit}
                  isSwapParticipant={Boolean(
                    swapAnimation?.registrationIds.includes(
                      assignment?.registrationId ?? '',
                    ),
                  )}
                  key={role}
                  member={memberFor(assignment)}
                  members={team.members}
                  moveMenuRegistrationId={moveMenuRegistrationId}
                  onArrange={arrange}
                  onCloseMoveMenu={() => setMoveMenuRegistrationId(null)}
                  onDragStateChange={(registrationId, active) =>
                    setActiveRegistrationId(active ? registrationId : null)
                  }
                  onToggleMoveMenu={() =>
                    assignment
                      ? setMoveMenuRegistrationId((current) =>
                          current === assignment.registrationId
                            ? null
                            : assignment.registrationId,
                        )
                      : undefined
                  }
                  swapAnimationKey={swapAnimation?.key ?? null}
                  role={role}
                />
              );
            })}
          </div>

          <div className='mt-3 border-t border-border pt-3'>
            <div className='flex flex-col gap-2 desktop:flex-row desktop:items-center'>
              <div className='flex shrink-0 items-center justify-between gap-4 desktop:w-[112px] desktop:flex-col desktop:items-start desktop:justify-center desktop:gap-0'>
                <Kicker>SUBSTITUTES</Kicker>
                <span className='text-[11px] text-muted-foreground'>
                  {substitutes.length} / 2 slots
                </span>
              </div>
              <div className='flex min-w-0 flex-1 flex-col gap-2 tablet:flex-row'>
                {substitutes.map(renderSubstitute)}
                {substitutes.length < 2 ? (
                  <div
                    className={cn(
                      'flex min-h-[52px] min-w-0 flex-1 select-none items-center gap-2 rounded-[10px] border border-border-strong bg-background/15 px-2.5 text-sm font-semibold text-secondary-foreground transition-[background-color,border-color,color,transform] duration-200 ease-out-quad',
                      activeRegistrationId
                        ? 'border-primary/70 bg-primary/5 text-primary-muted'
                        : 'border-border-strong',
                    )}
                    data-lineup-drop-kind='substitute'
                  >
                    <Plus
                      aria-hidden='true'
                      className='text-muted-foreground'
                      size={18}
                    />
                    <span>Drop substitute here</span>
                  </div>
                ) : null}
              </div>
              {canEdit ? (
                <FormSubmitButton className='min-h-10 w-full bg-primary px-3.5 text-xs text-primary-foreground shadow-lg shadow-primary/15 hover:bg-primary-hover desktop:w-auto'>
                  <Check aria-hidden='true' size={15} /> Save lineup
                </FormSubmitButton>
              ) : null}
            </div>
          </div>
        </LayoutGroup>

        <p aria-live='polite' className='sr-only'>
          {moveMessage}
        </p>
        {state.error ? (
          <Alert aria-live='polite' className='mt-3' variant='destructive'>
            <AlertDescription>{state.error}</AlertDescription>
          </Alert>
        ) : null}
        {state.success || previewSaveMessage ? (
          <p
            aria-live='polite'
            className='mt-2 text-[10px] font-medium text-success'
          >
            {state.success ?? previewSaveMessage}
          </p>
        ) : null}
      </form>
    </Card>
  );
}

function TeamMembershipControls({
  team,
  currentRegistrationId,
  deadlineStatus,
}: {
  team: TournamentTeamData;
  currentRegistrationId?: string;
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const currentMember = team.members.find(
    (member) => member.registrationId === currentRegistrationId,
  );
  const [leaveState, leaveAction] = useActionState<
    TournamentActionState,
    FormData
  >(leaveTeam, {});
  const [deleteState, deleteAction] = useActionState<
    TournamentActionState,
    FormData
  >(deleteTeam, {});
  const [transferState, transferAction] = useActionState<
    TournamentActionState,
    FormData
  >(transferTeamCaptaincy, {});

  if (!currentMember) return null;

  const exitMode = participantTeamExitMode({
    isCaptain: currentMember.isCaptain,
    memberCount: team.members.length,
  });
  const locked = team.status !== 'draft' || deadlineStatus === 'passed';
  const teammates = team.members.filter(
    (member) => member.registrationId !== currentMember.registrationId,
  );
  const actionError =
    leaveState.error ?? deleteState.error ?? transferState.error;

  return (
    <Card className='p-5'>
      <Kicker>TEAM MEMBERSHIP</Kicker>
      <h2 className='mt-2 font-display text-lg font-bold'>Your team spot</h2>
      {locked ? (
        <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
          {deadlineStatus === 'passed'
            ? 'Membership changes closed with registration.'
            : 'Ask the organizer to unlock this submitted team before changing membership.'}
        </p>
      ) : exitMode === 'transfer' ? (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            Choose a new captain first. You can leave after the transfer.
          </p>
          <form action={transferAction} className='mt-4 flex flex-col gap-3'>
            <input name='teamId' type='hidden' value={team.id} />
            <Field>
              <FieldLabel htmlFor='nextCaptainRegistrationId'>
                New captain
              </FieldLabel>
              <NativeSelect
                className='w-full'
                defaultValue=''
                id='nextCaptainRegistrationId'
                name='registrationId'
                required
              >
                <NativeSelectOption disabled value=''>
                  Choose a teammate
                </NativeSelectOption>
                {teammates.map((member) => (
                  <NativeSelectOption
                    key={member.registrationId}
                    value={member.registrationId}
                  >
                    {member.displayName} · {member.riotName}#{member.riotTag}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            <FormSubmitButton className='w-full border border-border bg-secondary text-foreground hover:border-border-strong'>
              <Crown size={16} /> Transfer captaincy
            </FormSubmitButton>
          </form>
        </>
      ) : exitMode === 'delete' ? (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            You are the only member. Deleting the team keeps your player profile
            and lets you create or join another team.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className='mt-4 w-full border border-danger/35 bg-danger-soft text-danger hover:bg-danger/15'
                  size='lg'
                />
              }
            >
              <Trash2 size={16} /> Delete team
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete {team.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  This removes the team and its pending invitations and
                  requests. Your player profile stays active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Keep team</AlertDialogCancel>
                <form action={deleteAction}>
                  <input name='teamId' type='hidden' value={team.id} />
                  <AlertDialogAction type='submit' variant='destructive'>
                    Delete team
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      ) : (
        <>
          <p className='mt-3 text-sm leading-5 text-secondary-foreground'>
            Leaving releases your roster spot. You will need a new invitation or
            join request to return.
          </p>
          <AlertDialog>
            <AlertDialogTrigger
              render={
                <Button
                  className='mt-4 w-full border border-danger/35 bg-danger-soft text-danger hover:bg-danger/15'
                  size='lg'
                />
              }
            >
              <LogOut size={16} /> Leave team
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Leave {team.name}?</AlertDialogTitle>
                <AlertDialogDescription>
                  You will lose this roster spot. Your player profile and
                  tournament access will stay active.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Stay on team</AlertDialogCancel>
                <form action={leaveAction}>
                  <input name='teamId' type='hidden' value={team.id} />
                  <AlertDialogAction type='submit' variant='destructive'>
                    Leave team
                  </AlertDialogAction>
                </form>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </>
      )}
      {actionError ? (
        <Alert aria-live='polite' className='mt-4' variant='destructive'>
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}
      {transferState.success ? (
        <Alert
          aria-live='polite'
          className='mt-4 border-success/30 bg-success-soft text-success'
        >
          <AlertDescription className='text-success'>
            {transferState.success} You can now leave the team.
          </AlertDescription>
        </Alert>
      ) : null}
    </Card>
  );
}

function TeamRoomView(props: {
  initialSubmitted?: boolean;
  team?: TournamentTeamData | null;
  registration?: TournamentRegistrationData | null;
  currentRegistrationId?: string;
  participants?: TournamentParticipantOption[];
  incomingInvites?: TournamentIncomingInviteData[];
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  if (props.team === null && props.registration === null) {
    return <RegistrationRequiredTeamView />;
  }

  if (props.team === null) {
    return (
      <CreateTeamView
        deadlineStatus={props.deadlineStatus}
        incomingInvites={props.incomingInvites}
      />
    );
  }

  return <TeamRoomContent {...props} team={props.team ?? undefined} />;
}

function TeamRoomContent({
  initialSubmitted = false,
  team,
  currentRegistrationId,
  participants,
  deadlineStatus,
}: {
  initialSubmitted?: boolean;
  team?: TournamentTeamData;
  currentRegistrationId?: string;
  participants?: TournamentParticipantOption[];
  deadlineStatus?: 'open' | 'upcoming' | 'passed';
}) {
  const preview = team === undefined;
  const [submitted, setSubmitted] = useState(
    initialSubmitted || team?.status === 'submitted',
  );
  const [requestState, setRequestState] = useState<
    'pending' | 'accepted' | 'declined'
  >('pending');
  const [renaming, setRenaming] = useState(false);
  const [lineupDraft, setLineupDraft] = useState<LineupAssignment[] | null>(
    null,
  );
  const [submitState, submitAction] = useActionState<
    TournamentActionState,
    FormData
  >(submitTeam, {});
  const [requestActionState, requestAction] = useActionState<
    TournamentActionState,
    FormData
  >(respondToJoinRequest, {});
  const [inviteState, inviteAction] = useActionState<
    TournamentActionState,
    FormData
  >(inviteParticipant, {});
  const [renameState, renameAction] = useActionState<
    TournamentActionState,
    FormData
  >(renameTeam, {});
  const actualTeam = team;
  const liveMembers = actualTeam?.members ?? [];
  const displayedMembers = lineupDraft
    ? liveMembers.map((member) => {
        const assignment = lineupDraft.find(
          (candidate) => candidate.registrationId === member.registrationId,
        );
        return assignment
          ? {
              ...member,
              lineupPosition: assignment.lineupPosition,
              starterRole: assignment.starterRole,
            }
          : member;
      })
    : liveMembers;
  const liveValidation = actualTeam ? validateRoster(displayedMembers) : null;
  const liveStarters = actualTeam
    ? starterSlots.map((role) => {
        const member = displayedMembers.find(
          (candidate) =>
            candidate.lineupPosition === 'starter' &&
            candidate.starterRole === role,
        );
        return member ? playerFromMember(member) : undefined;
      })
    : rosterPlayers.slice(0, 5);
  const substituteCount = actualTeam
    ? displayedMembers.filter(
        (member) => member.lineupPosition === 'substitute',
      ).length
    : Number(Boolean(rosterPlayers[5]));
  const starterCount = liveStarters.filter(Boolean).length;
  const tierEntries: Array<[Tier, number]> = liveValidation
    ? (Object.entries(liveValidation.tierCounts) as Array<[Tier, number]>)
    : [
        ['T1', 1],
        ['T2', 0],
        ['T3', 4],
        ['T4', 1],
      ];
  const teamName = actualTeam?.name ?? 'Void Hunters';
  const teamStatus = actualTeam?.status ?? (submitted ? 'submitted' : 'draft');
  const isSubmitted =
    submitted || teamStatus === 'submitted' || Boolean(submitState.success);
  const isCaptain = Boolean(
    actualTeam &&
    currentRegistrationId &&
    actualTeam.members.some(
      (member) =>
        member.registrationId === currentRegistrationId && member.isCaptain,
    ),
  );
  const changesClosed = deadlineStatus === 'passed';
  const showCaptainControls = (preview || isCaptain) && !changesClosed;
  const canRename = preview || (isCaptain && !changesClosed);
  const inviteOptions = participants
    ? availableTournamentParticipants(
        participants,
        actualTeam?.members.map((member) => member.registrationId),
        actualTeam?.invites
          .filter((invite) => invite.status === 'pending')
          .map((invite) => invite.invitedRegistrationId),
      )
    : undefined;
  const pendingInvites =
    actualTeam?.invites.filter((invite) => invite.status === 'pending') ?? [];
  const pendingJoinRequests =
    actualTeam?.joinRequests.filter(
      (request) => request.status === 'pending',
    ) ?? [];

  function submitPreviewTeam() {
    setSubmitted(true);
    window.scrollTo({ top: 0 });
  }

  return (
    <PageFrame className={!isSubmitted ? 'pb-10' : undefined}>
      <div className='flex flex-col gap-[18px]'>
        <div className='flex flex-col gap-3 desktop:flex-row desktop:items-end desktop:justify-between'>
          <div>
            <Kicker className='text-primary'>TEAM ROOM</Kicker>
            <h1 className='mt-1 font-display text-[28px] font-bold leading-[1.1] tracking-[-0.03em] text-foreground desktop:text-[34px]'>
              {teamName}.
            </h1>
            <p className='mt-1 text-[11px] text-secondary-foreground desktop:text-sm'>
              <span className='desktop:hidden'>
                Captain{' '}
                {actualTeam?.members.find((member) => member.isCaptain)
                  ?.displayName ?? 'Captain'}{' '}
                - {isSubmitted ? 'submitted roster' : 'draft roster'} -{' '}
                {starterCount} / 5 starters
              </span>
              <span className='hidden desktop:inline'>
                Captain{' '}
                {actualTeam?.members.find((member) => member.isCaptain)
                  ?.displayName ?? 'Captain'}{' '}
                - {isSubmitted ? 'submitted roster' : 'draft roster'} -{' '}
                {liveMembers.length} members - {starterCount}{' '}
                {starterCount === 1 ? 'starter' : 'starters'}
              </span>
            </p>
          </div>
          {!isSubmitted && showCaptainControls ? (
            <div className='flex flex-wrap gap-2'>
              <ButtonLink
                className='min-h-10 rounded-xl px-3.5 py-2.5 text-xs shadow-primary/15'
                href='#team-activity'
              >
                <Plus aria-hidden='true' size={15} /> Invite player
              </ButtonLink>
              <ButtonLink
                className='min-h-10 rounded-lg border border-border-strong bg-transparent px-3 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary'
                href='#team-activity'
                variant='secondary'
              >
                Review request
              </ButtonLink>
              {canRename ? (
                <Button
                  className='min-h-10 rounded-lg border border-border-strong bg-transparent px-3 py-2.5 text-xs font-bold text-secondary-foreground hover:bg-secondary'
                  onClick={() => setRenaming((current) => !current)}
                  size='lg'
                  type='button'
                  variant='outline'
                >
                  {renaming ? (
                    'Cancel'
                  ) : (
                    <>
                      Rename <span className='hidden desktop:inline'>team</span>
                    </>
                  )}
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>

        {isSubmitted ? (
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0px) scale(1)' }}
            initial={{ opacity: 0, transform: 'translateY(8px) scale(0.99)' }}
            transition={{ duration: 0.22, ease: easeOutExpo }}
          >
            <Card
              className='border-success/30 bg-success-soft/70 p-5 desktop:p-6'
              aria-live='polite'
            >
              <div className='flex items-start gap-4'>
                <span className='grid size-11 shrink-0 place-items-center rounded-xl bg-success/12 text-success'>
                  <LockKeyhole size={21} />
                </span>
                <div>
                  <Kicker className='text-success'>ROSTER SUBMITTED</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Participant editing is locked
                  </h2>
                  <p className='mt-2 max-w-2xl text-sm leading-5 text-secondary-foreground'>
                    This is the roster the organizer will review. Only the
                    organizer can unlock it for another participant edit.
                  </p>
                </div>
              </div>
            </Card>
            <Card className='border-success/25 bg-card p-5 desktop:p-6'>
              <div className='flex flex-wrap items-start justify-between gap-4'>
                <div>
                  <Kicker className='text-success'>SUBMISSION RECEIPT</Kicker>
                  <h2 className='mt-2 font-display text-xl font-bold'>
                    Valid roster accepted
                  </h2>
                  <p className='mt-2 text-sm leading-5 text-secondary-foreground'>
                    {actualTeam?.submittedAt
                      ? `Submitted ${new Date(actualTeam.submittedAt).toLocaleString('en', { dateStyle: 'medium', timeStyle: 'short' })}.`
                      : 'Your five starters and approved tier limits passed validation.'}
                  </p>
                </div>
                <span
                  className='grid size-11 place-items-center rounded-xl bg-success-soft text-success'
                  aria-hidden='true'
                >
                  <CheckCircle2 size={21} />
                </span>
              </div>
              <div className='mt-5 grid gap-3 border-t border-border pt-4 text-sm tablet:grid-cols-3'>
                <div>
                  <Kicker>STARTERS</Kicker>
                  <p className='mt-1 font-semibold'>
                    {liveStarters.filter(Boolean).length} / 5
                  </p>
                </div>
                <div>
                  <Kicker>SUBSTITUTES</Kicker>
                  <p className='mt-1 font-semibold'>{substituteCount} / 2</p>
                </div>
                <div>
                  <Kicker>STATUS</Kicker>
                  <p className='mt-1 font-semibold text-success'>
                    LOCKED FOR REVIEW
                  </p>
                </div>
              </div>
              <p className='mt-5 border-t border-border pt-4 text-sm leading-5 text-secondary-foreground'>
                Need a change? Ask the organizer to unlock the team. Participant
                edits stay disabled until then.
              </p>
            </Card>
          </motion.div>
        ) : (
          <>
            {changesClosed ? (
              <Alert className='mt-4 border-danger/30 bg-danger-soft text-danger'>
                <AlertDescription className='text-danger'>
                  Team changes are closed because the registration deadline has
                  passed.
                </AlertDescription>
              </Alert>
            ) : null}
            {renaming && canRename && !renameState.success ? (
              <form
                action={renameAction}
                className='mt-4 flex flex-col gap-3 rounded-2xl border border-border bg-secondary p-4 tablet:flex-row tablet:items-end'
                onSubmit={
                  preview
                    ? (event) => {
                        event.preventDefault();
                        setRenaming(false);
                      }
                    : undefined
                }
              >
                <input
                  name='teamId'
                  type='hidden'
                  value={actualTeam?.id ?? 'preview-team'}
                />
                <Field className='min-w-0 flex-1'>
                  <FieldLabel htmlFor='team-name'>Team name</FieldLabel>
                  <Input
                    defaultValue={teamName}
                    id='team-name'
                    maxLength={60}
                    name='teamName'
                    required
                  />
                </Field>
                <FormSubmitButton className='bg-primary text-primary-foreground hover:bg-primary-hover'>
                  Save name
                </FormSubmitButton>
              </form>
            ) : null}
            {renameState.error ? (
              <Alert aria-live='polite' className='mt-4' variant='destructive'>
                <AlertDescription>{renameState.error}</AlertDescription>
              </Alert>
            ) : null}
            {renameState.success ? (
              <Alert
                aria-live='polite'
                className='mt-4 border-success/30 bg-success-soft text-success'
              >
                <AlertDescription className='text-success'>
                  {renameState.success}
                </AlertDescription>
              </Alert>
            ) : null}
          </>
        )}

        <div className='grid grid-cols-2 gap-4'>
          <div className='contents'>
            <LineupEditor
              className='desktop:col-span-2'
              currentRegistrationId={currentRegistrationId}
              deadlineStatus={deadlineStatus}
              onAssignmentsChange={setLineupDraft}
              preview={preview}
              team={actualTeam ?? previewTeam}
            />

            {!isSubmitted ? (
              <Card
                className='bg-secondary p-3.5 desktop:p-4.5 h-fit'
                id='team-activity'
              >
                <div className='flex items-center justify-between gap-3'>
                  <Kicker>INVITES & REQUESTS</Kicker>
                  <h2 className='sr-only'>Captain inbox</h2>
                  <span className='text-[11px] text-primary'>
                    {pendingInvites.length + pendingJoinRequests.length} waiting
                  </span>
                </div>
                {isCaptain &&
                !changesClosed &&
                inviteOptions &&
                inviteOptions.length > 0 ? (
                  <form
                    action={inviteAction}
                    className='mt-3 flex flex-col gap-3'
                  >
                    <input
                      name='teamId'
                      type='hidden'
                      value={actualTeam?.id ?? ''}
                    />
                    <Field className='min-w-0 flex-1'>
                      <FieldLabel htmlFor='invitedRegistrationId'>
                        Invite a registered player
                      </FieldLabel>
                      <FieldDescription>
                        Select from players without a team.
                      </FieldDescription>
                      <NativeSelect
                        className='mt-2 w-full rounded-lg'
                        id='invitedRegistrationId'
                        name='invitedRegistrationId'
                        defaultValue=''
                      >
                        <NativeSelectOption disabled value=''>
                          Choose a player
                        </NativeSelectOption>
                        {inviteOptions.map((participant) => (
                          <NativeSelectOption
                            key={participant.id}
                            value={participant.id}
                          >
                            {participant.displayName} · {participant.riotName}#
                            {participant.riotTag}
                          </NativeSelectOption>
                        ))}
                      </NativeSelect>
                    </Field>
                    <FormSubmitButton className='self-start border border-border-strong bg-transparent text-secondary-foreground hover:bg-background/30'>
                      Send invite
                    </FormSubmitButton>
                  </form>
                ) : null}
                {inviteState.error ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4'
                    variant='destructive'
                  >
                    <AlertDescription>{inviteState.error}</AlertDescription>
                  </Alert>
                ) : null}
                {inviteState.success ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4 border-success/30 bg-success-soft text-success'
                  >
                    <AlertDescription className='text-success'>
                      {inviteState.success}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {pendingInvites.length > 0 ? (
                  <div className='mt-4 flex flex-col gap-2 border-t border-border pt-3'>
                    {pendingInvites.map((invite) => (
                      <div className='flex items-start gap-2' key={invite.id}>
                        <Clock3
                          className='mt-0.5 shrink-0 text-primary'
                          size={14}
                        />
                        <div>
                          <p className='text-[11px] font-semibold'>
                            Invitation sent to {invite.displayName}
                          </p>
                          <p className='mt-0.5 text-[9px] text-muted-foreground'>
                            Waiting for acceptance
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
                {pendingJoinRequests.length > 0 ? (
                  <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
                    {pendingJoinRequests.map((request) => (
                      <div
                        className='rounded-2xl border border-primary/30 bg-primary-soft p-4'
                        key={request.id}
                      >
                        <div className='flex items-start justify-between gap-3'>
                          <div>
                            <Kicker className='text-primary-muted'>
                              JOIN REQUEST
                            </Kicker>
                            <p className='mt-2 text-sm font-semibold'>
                              {request.displayName} ·{' '}
                              {request.approvedTier ?? 'Pending'} ·{' '}
                              {request.primaryRole}
                            </p>
                          </div>
                          <StatusPill tone='warning'>WAITING</StatusPill>
                        </div>
                        {showCaptainControls ? (
                          <form
                            action={requestAction}
                            className='mt-4 flex gap-2'
                          >
                            <input
                              name='requestId'
                              type='hidden'
                              value={request.id}
                            />
                            <Button
                              className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                              name='decision'
                              size='lg'
                              type='submit'
                              value='accepted'
                            >
                              Accept
                            </Button>
                            <Button
                              className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                              name='decision'
                              size='lg'
                              type='submit'
                              value='declined'
                            >
                              Decline
                            </Button>
                          </form>
                        ) : (
                          <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                            {changesClosed
                              ? 'The deadline has passed. The captain can no longer resolve requests.'
                              : 'Only the team captain can resolve requests.'}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : preview ? (
                  <div className='mt-5 grid gap-3 tablet:grid-cols-2'>
                    <div className='rounded-2xl border border-border bg-secondary p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <Kicker>TEAM INVITE</Kicker>
                          <p className='mt-2 text-sm font-semibold'>Kai#2288</p>
                        </div>
                        <StatusPill>WAITING</StatusPill>
                      </div>
                      <p className='mt-3 text-xs leading-5 text-muted-foreground'>
                        The invite expires when Kai joins another team.
                      </p>
                    </div>
                    <div className='rounded-2xl border border-primary/30 bg-primary-soft p-4'>
                      <div className='flex items-start justify-between gap-3'>
                        <div>
                          <Kicker className='text-primary-muted'>
                            JOIN REQUEST
                          </Kicker>
                          <p className='mt-2 text-sm font-semibold'>
                            Niko#8128 · T2 · Mid
                          </p>
                        </div>
                        <StatusPill
                          tone={
                            requestState === 'accepted'
                              ? 'success'
                              : requestState === 'declined'
                                ? 'danger'
                                : 'warning'
                          }
                        >
                          {requestState.toUpperCase()}
                        </StatusPill>
                      </div>
                      {requestState === 'pending' ? (
                        <div className='mt-4 flex gap-2'>
                          <Button
                            className='min-h-11 flex-1 bg-primary text-primary-foreground hover:bg-primary-hover'
                            onClick={() => setRequestState('accepted')}
                            size='lg'
                            type='button'
                          >
                            Accept
                          </Button>
                          <Button
                            className='min-h-11 flex-1 border border-border bg-secondary text-foreground hover:border-border-strong'
                            onClick={() => setRequestState('declined')}
                            size='lg'
                            type='button'
                          >
                            Decline
                          </Button>
                        </div>
                      ) : (
                        <p className='mt-3 text-xs text-secondary-foreground'>
                          Request {requestState}.
                        </p>
                      )}
                    </div>
                  </div>
                ) : pendingInvites.length === 0 ? (
                  <p className='mt-5 text-sm text-muted-foreground'>
                    No pending invites or join requests.
                  </p>
                ) : null}
                {requestActionState.error ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4'
                    variant='destructive'
                  >
                    <AlertDescription>
                      {requestActionState.error}
                    </AlertDescription>
                  </Alert>
                ) : null}
                {requestActionState.success ? (
                  <Alert
                    aria-live='polite'
                    className='mt-4 border-success/30 bg-success-soft text-success'
                  >
                    <AlertDescription className='text-success'>
                      {requestActionState.success}
                    </AlertDescription>
                  </Alert>
                ) : null}
              </Card>
            ) : null}
          </div>

          <aside className='flex flex-col gap-5 row-span-2 '>
            <Card className='p-5'>
              <Kicker>ROSTER VALIDATION</Kicker>
              <div
                className={cn(
                  'mt-4 rounded-xl border p-4',
                  liveValidation?.valid === false
                    ? 'border-danger/25 bg-danger-soft'
                    : 'border-success/25 bg-success-soft',
                )}
              >
                <div
                  className={cn(
                    'flex items-start gap-2.5',
                    liveValidation?.valid === false
                      ? 'text-danger'
                      : 'text-success',
                  )}
                >
                  {liveValidation?.valid === false ? (
                    <AlertTriangle className='mt-0.5 shrink-0' size={18} />
                  ) : (
                    <CheckCircle2 className='mt-0.5 shrink-0' size={18} />
                  )}
                  <div>
                    <p className='m-0 text-sm font-semibold'>
                      {liveValidation?.valid === false
                        ? 'Blocking issues'
                        : 'No blocking issues'}
                    </p>
                    {liveValidation?.valid === false ? (
                      <ul className='mt-1 mb-0 list-disc space-y-1 pl-4 text-xs leading-5 text-secondary-foreground'>
                        {liveValidation.blockingIssues.map((issue) => (
                          <li key={issue}>{issue}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className='mt-1 text-xs leading-5 text-secondary-foreground'>
                        Five starters, approved tiers, and tier caps all pass.
                      </p>
                    )}
                  </div>
                </div>
              </div>
              {(liveValidation?.warnings.length ?? 1) > 0 ? (
                <div className='mt-3 rounded-xl border border-warning/25 bg-warning-soft p-4'>
                  <div className='flex items-start gap-2.5 text-warning'>
                    <AlertTriangle className='mt-0.5 shrink-0' size={18} />
                    <div>
                      <p className='m-0 text-sm font-semibold'>Role warnings</p>
                      <ul className='mt-1 mb-0 list-disc space-y-1 pl-4 text-xs leading-5 text-secondary-foreground'>
                        {(
                          liveValidation?.warnings ?? [
                            'Mori prefers Baron or Support, not Dragon.',
                          ]
                        ).map((warning) => (
                          <li key={warning}>
                            {warning} This does not block submission.
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              ) : null}
              <div className='mt-5 border-t border-border pt-4'>
                <Kicker>FULL ROSTER TIERS</Kicker>
                <div className='mt-3 flex flex-wrap gap-2'>
                  {tierEntries
                    .filter(([, count]) => count > 0)
                    .map(([tier, count]) => (
                      <span
                        className={cn('text-sm', tierMeta[tier].text)}
                        key={tier}
                      >
                        {count} × {tier}
                      </span>
                    ))}
                </div>
              </div>
              {!isSubmitted && showCaptainControls ? (
                <div className='mt-5 border-t border-border pt-5'>
                  {preview ? (
                    <>
                      <Button
                        className='hidden min-h-11 w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex'
                        onClick={submitPreviewTeam}
                        size='lg'
                        type='button'
                      >
                        <ShieldCheck size={17} /> Submit team
                      </Button>
                      <p className='mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block'>
                        Submission locks participant editing.
                      </p>
                    </>
                  ) : (
                    <form
                      action={submitAction}
                      onSubmit={() => window.scrollTo({ top: 0 })}
                    >
                      <input
                        name='teamId'
                        type='hidden'
                        value={actualTeam?.id ?? ''}
                      />
                      <FormSubmitButton className='hidden w-full bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary-hover desktop:inline-flex'>
                        <ShieldCheck size={17} /> Submit team
                      </FormSubmitButton>
                      <p className='mt-3 mb-0 hidden text-center text-xs leading-5 text-muted-foreground desktop:block'>
                        Submission locks participant editing.
                      </p>
                    </form>
                  )}
                </div>
              ) : null}
              {submitState.error ? (
                <Alert
                  aria-live='polite'
                  className='mt-4'
                  variant='destructive'
                >
                  <AlertDescription>
                    <span className='font-semibold'>{submitState.error}</span>
                    {submitState.blockingIssues?.map((issue) => (
                      <span
                        className='mt-2 block text-xs text-secondary-foreground'
                        key={issue}
                      >
                        {issue}
                      </span>
                    ))}
                  </AlertDescription>
                </Alert>
              ) : null}
            </Card>
          </aside>
          {actualTeam ? (
            <TeamMembershipControls
              currentRegistrationId={currentRegistrationId}
              deadlineStatus={deadlineStatus}
              team={actualTeam}
            />
          ) : null}
        </div>
      </div>
    </PageFrame>
  );
}

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

export function TournamentApp({
  view,
  tournamentName = defaultSettings.tournamentName,
  region = defaultSettings.region,
  deadline = defaultSettings.deadline,
  deadlineRemaining = defaultSettings.deadlineRemaining,
  deadlineStatus = defaultSettings.deadlineStatus,
  userName = 'Jinxed',
  showSignOut = true,
  registration,
  teams,
  team,
  teamDetails,
  players,
  playerProfile,
  tierReview,
  currentRegistrationId,
  dashboard,
  overview,
  participants,
  adminTeams,
  announcements,
  incomingInvites,
  settings,
}: TournamentAppProps) {
  const previewRegistration =
    registration === undefined
      ? {
          approvedTier: 'T2' as Tier,
          tierStatus: 'approved' as const,
        }
      : registration;
  const DashboardComponent = RevisedDashboardView;

  if (view === 'invite') {
    return (
      <InvitePreviewView
        deadline={deadline}
        deadlineRemaining={deadlineRemaining}
        deadlineStatus={deadlineStatus}
        region={region}
        tournamentName={tournamentName}
      />
    );
  }

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
        {view === 'registration' || view === 'profile' ? (
          <RegistrationView
            deadline={deadline}
            deadlineRemaining={deadlineRemaining}
            deadlineStatus={deadlineStatus}
            region={region}
            registration={registration}
            tournamentName={tournamentName}
          />
        ) : null}
        {view === 'dashboard' ? (
          <DashboardComponent
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
        ) : null}
        {view === 'teams' ? (
          <BrowseTeamsView
            deadlineStatus={deadlineStatus}
            registration={registration}
            team={team}
            teams={teams}
          />
        ) : null}
        {view === 'team-details' ? (
          <TeamDetailsView teamDetails={teamDetails} />
        ) : null}
        {view === 'players' ? (
          <PlayerDirectoryView
            currentRegistrationId={currentRegistrationId}
            players={players}
          />
        ) : null}
        {view === 'player-details' ? (
          <PlayerDetailsView
            currentRegistrationId={currentRegistrationId}
            playerProfile={playerProfile}
          />
        ) : null}
        {view === 'builder' ? (
          <TeamRoomView
            currentRegistrationId={currentRegistrationId}
            deadlineStatus={deadlineStatus}
            incomingInvites={incomingInvites}
            participants={participants}
            registration={registration}
            team={team}
          />
        ) : null}
        {view === 'submitted' ? (
          <TeamRoomView
            currentRegistrationId={currentRegistrationId}
            deadlineStatus={deadlineStatus}
            incomingInvites={incomingInvites}
            initialSubmitted
            participants={participants}
            registration={registration}
            team={team}
          />
        ) : null}
        {view === 'admin' ? (
          <OrganizerOverview
            announcements={announcements}
            deadline={deadline}
            deadlineRemaining={deadlineRemaining}
            deadlineStatus={deadlineStatus}
            overview={overview}
            region={region}
            tournamentName={tournamentName}
          />
        ) : null}
        {view === 'tier-review' ? (
          <OrganizerTierReview review={tierReview} />
        ) : null}
        {view === 'admin-teams' ? (
          <OrganizerTeamManager
            participants={participants ?? []}
            teams={adminTeams ?? []}
          />
        ) : null}
        {view === 'announcements' ? <PageFrame><ParticipantAnnouncements announcements={announcements ?? []} team={team} deadline={deadline} deadlineStatus={deadlineStatus} /></PageFrame> : null}
        {view === 'admin-announcements' ? <PageFrame><OrganizerAnnouncements announcements={announcements ?? []} /></PageFrame> : null}
        {view === 'admin-settings' && settings ? <PageFrame><OrganizerSettings settings={settings} deadlineStatus={deadlineStatus} /></PageFrame> : null}
      </div>
    </MotionConfig>
  );
}
