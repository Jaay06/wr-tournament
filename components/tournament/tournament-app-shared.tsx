'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { AnimatePresence, motion } from 'motion/react';
import type { HTMLAttributes, ReactNode } from 'react';
import { useState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Clock3,
  LockKeyhole,
  LogOut,
  Menu,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  UserRoundCheck,
  Users,
  X,
} from 'lucide-react';

import { RiftClashMark } from '@/components/brand/rift-clash-logo';
import { AnimatedButtonLabel } from '@/components/ui/animated-button-label';
import { Avatar as ShadcnAvatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card as ShadcnCard } from '@/components/ui/card';
import { RoleIcon } from '@/components/tournament/role-icon';
import { cn } from '@/lib/utils';
import type { RoomSettings } from '@/components/tournament/room-communications';
import type {
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentPlayerProfileData,
  TournamentRegistrationData,
  TournamentTeamData,
  TournamentTeamDetailData,
  TournamentTeamSummary,
  TournamentAnnouncementData,
  TournamentDashboardData,
  TournamentIncomingInviteData,
  TierReviewData,
  OrganizerOverviewData,
} from '@/lib/tournament-types';
import type { LineupDropTarget } from '@/lib/tournament-rules';

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

export type Tier = 'T1' | 'T2' | 'T3' | 'T4';
export type Role = 'Baron' | 'Jungle' | 'Mid' | 'Dragon' | 'Support';
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

export type Player = {
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

export function playerFromMember(member: TournamentMemberData): Player {
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

export const defaultSettings = {
  tournamentName: 'Rift Clash VI',
  region: 'EU West',
  deadline: 'Sep 6, 2026 · 23:59 UTC',
  deadlineRemaining: '6D 14H LEFT',
  deadlineStatus: 'upcoming' as const,
};

export const tierMeta: Record<
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

export const rosterPlayers: Player[] = [
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

export const starterSlots = ['Baron', 'Jungle', 'Mid', 'Dragon', 'Support'] as const;

export function lineupDropTargetAtPoint(point: { x: number; y: number }) {
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

export const previewTeamDetails: TournamentTeamDetailData = {
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

export const previewTeam: TournamentTeamData = {
  ...previewTeamDetails,
  joinRequests: [],
  invites: [],
};

export const teamCards = [
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

export const easeOutExpo = [0.19, 1, 0.22, 1] as const;
export const stateSwapTransition = {
  type: 'spring',
  duration: 0.3,
  bounce: 0,
} as const;

export function DashboardBrand({ href, organizer = false }: { href: string; organizer?: boolean }) {
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

export function ClientSignOutButton({
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

export function AppHeader({
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

export function PageFrame({
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

export function Card({
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

export function Kicker({
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

export function RoleLabel({ role, className }: { role: Role; className?: string }) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <RoleIcon className='size-4' roleName={role} />
      <Kicker>{role.toUpperCase()}</Kicker>
    </div>
  );
}

export function RoleValue({ role, className }: { role: Role; className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5', className)}>
      <RoleIcon className='size-3.5' roleName={role} />
      <span>{role}</span>
    </span>
  );
}

export function RolePreference({
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

export function SectionHeading({
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

export function TierBadge({ tier }: { tier: Tier }) {
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

export function StatusPill({
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

export function Avatar({
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

export function ButtonLink({
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

export function FormSubmitButton({
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

export function DeadlineBanner({
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
