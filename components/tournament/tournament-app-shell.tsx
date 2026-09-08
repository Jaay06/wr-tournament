'use client';

import { Collapsible } from '@base-ui/react/collapsible';
import Link from 'next/link';
import {
  ChevronUp,
  Link2,
  MessageSquareText,
  Search,
  Settings,
  ShieldCheck,
  Swords,
  UserRoundCheck,
  Users,
  UserGroup,
} from 'lucide-react';
import type { ReactNode } from 'react';

import { Avatar as ShadcnAvatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Badge } from '@/components/ui/badge';
import {
  ClientSignOutButton,
  DashboardBrand,
  StatusPill,
} from './tournament-app-shared';
import type {
  TournamentAppProps,
  TournamentView,
} from './tournament-app-shared';
import { cn } from '@/lib/utils';

type TournamentAppShellProps = TournamentAppProps & {
  approvedTier?: 'T1' | 'T2' | 'T3' | 'T4' | null;
  children: ReactNode;
  teamStatus?: 'draft' | 'submitted';
  tierStatus?: 'pending' | 'approved';
  deadlineRemaining: string;
  deadlineStatus: 'open' | 'upcoming' | 'passed';
  region: string;
  showSignOut: boolean;
  userName: string;
};

type NavigationItem = {
  key: string;
  label: string;
  href: string;
  icon: typeof ShieldCheck;
};

function getActiveKey(view: TournamentView) {
  if (view === 'registration') return 'profile';
  if (view === 'account') return 'account';
  if (
    view === 'team-details' ||
    view === 'players' ||
    view === 'player-details'
  ) {
    return 'teams';
  }
  if (view === 'submitted') return 'builder';
  if (view === 'admin-teams') return 'teams-admin';
  if (view === 'admin-announcements') return 'announcements';
  if (view === 'admin-settings') return 'settings';
  if (view === 'admin-draft') return 'admin-draft';
  return view;
}

export function TournamentAppShell({
  children,
  view,
  region,
  userName,
  showSignOut,
  teamStatus,
  approvedTier,
  tierStatus,
  deadlineRemaining,
  deadlineStatus,
}: TournamentAppShellProps) {
  const organizer =
    view === 'admin' || view === 'tier-review' || view.startsWith('admin-');
  const participantItems: NavigationItem[] = [
    {
      key: 'dashboard',
      label: 'Overview',
      href: '/tournament',
      icon: ShieldCheck,
    },
    { key: 'builder', label: 'My team', href: '/tournament/team', icon: Users },
    {
      key: 'teams',
      label: 'Browse teams',
      href: '/tournament/teams',
      icon: UserGroup,
    },
    {
      key: 'players',
      label: 'Browse players',
      href: '/tournament/players',
      icon: Search,
    },
    {
      key: 'announcements',
      label: 'Announcements',
      href: '/tournament/announcements',
      icon: MessageSquareText,
    },
    {
      key: 'draft',
      label: 'Draft room',
      href: '/tournament/draft',
      icon: Swords,
    },
  ];
  const organizerItems: NavigationItem[] = [
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
    {
      key: 'admin-draft',
      label: 'Draft setup',
      href: '/admin/draft',
      icon: Swords,
    },
  ];
  const items = organizer ? organizerItems : participantItems;
  const activeKey = getActiveKey(view);
  const activeItem = items.find((item) => item.key === activeKey);
  const activeLabel =
    activeKey === 'profile'
      ? 'Player profile'
      : activeKey === 'account'
        ? 'Connected accounts'
        : (activeItem?.label ?? 'Overview');
  const participantTierLabel = approvedTier
    ? `${approvedTier} APPROVED`
    : tierStatus === 'pending'
      ? 'TIER PENDING'
      : 'PROFILE INCOMPLETE';
  const deadlineLabel =
    deadlineStatus === 'passed' ? 'CLOSED' : (deadlineRemaining ?? 'OPEN');
  const homeHref = organizer ? '/admin' : '/tournament';
  const teamRoom = view === 'builder' || view === 'submitted';
  const accountMenuOpen = activeKey === 'profile' || activeKey === 'account';
  const identityStatus = organizer
    ? 'ORGANIZER'
    : teamRoom
      ? `${region.toUpperCase()} / ${participantTierLabel}`
      : participantTierLabel;
  const initial = userName.slice(0, 1).toUpperCase();

  return (
    <>
      <Sidebar
        className='border-white/10 bg-shell-sidebar text-shell-sidebar-foreground'
        collapsible='offcanvas'
      >
        <SidebarHeader className='px-[18px] py-7'>
          <DashboardBrand href={homeHref} organizer={organizer} />
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup className='border-t border-white/10 px-[18px] py-6'>
            <SidebarGroupLabel className='h-auto px-3 py-0 font-mono text-[9px] font-semibold tracking-[0.2em] text-shell-sidebar-muted'>
              {organizer ? 'CONTROL ROOM' : 'TOURNAMENT'}
            </SidebarGroupLabel>
            <SidebarGroupContent className='mt-4'>
              <SidebarMenu className='gap-1'>
                {items.map(({ href, icon: Icon, key, label }) => (
                  <SidebarMenuItem key={key}>
                    <SidebarMenuButton
                      aria-current={activeKey === key ? 'page' : undefined}
                      className={cn(
                        'relative min-h-11 rounded-lg px-3 text-sm font-medium text-shell-sidebar-muted transition-[background-color,color,transform] duration-150 ease-out-quad hover:bg-white/6 hover:text-shell-sidebar-foreground active:translate-y-px',
                        activeKey === key &&
                          'bg-white/9 font-semibold text-shell-sidebar-foreground before:absolute before:inset-y-2 before:left-0 before:w-0.5 before:rounded-full before:bg-primary',
                      )}
                      isActive={activeKey === key}
                      render={<Link href={href} />}
                    >
                      <Icon aria-hidden='true' size={17} strokeWidth={1.7} />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className='gap-3 border-t border-white/10 px-[18px] py-5'>
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

          <SidebarMenu>
            <Collapsible.Root
              className='group/collapsible'
              defaultOpen={accountMenuOpen}
            >
              <SidebarMenuItem>
                <Collapsible.Trigger
                  aria-label={`Open ${userName} menu`}
                  render={
                    <SidebarMenuButton
                      className='h-12 gap-3 rounded-xl border border-white/10 bg-white/4 px-3 text-shell-sidebar-foreground hover:bg-white/8 hover:text-shell-sidebar-foreground'
                      size='lg'
                      tooltip={`${userName} menu`}
                    />
                  }
                >
                  <ShadcnAvatar className='size-8 shrink-0' size='default'>
                    <AvatarFallback className='bg-primary text-sm font-bold text-primary-foreground'>
                      {initial}
                    </AvatarFallback>
                  </ShadcnAvatar>
                  <span className='flex min-w-0 flex-1 flex-col text-left'>
                    <span className='truncate text-sm font-semibold'>
                      {userName}
                    </span>
                    <span className='mt-0.5 truncate font-mono text-[8px] tracking-[0.12em] text-shell-sidebar-muted'>
                      {identityStatus}
                    </span>
                  </span>
                  <ChevronUp
                    aria-hidden='true'
                    className='ml-auto shrink-0 transition-transform duration-150 ease-out-quad group-data-[open]/collapsible:rotate-180'
                    size={16}
                  />
                </Collapsible.Trigger>

                <Collapsible.Panel keepMounted>
                  <SidebarMenuSub className='mx-3.5 mt-1 border-white/10 px-2.5'>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        aria-current={
                          activeKey === 'profile' ? 'page' : undefined
                        }
                        isActive={activeKey === 'profile'}
                        render={<Link href='/tournament/profile' />}
                      >
                        <UserRoundCheck aria-hidden='true' size={16} />
                        <span>Player profile</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                    <SidebarMenuSubItem>
                      <SidebarMenuSubButton
                        aria-current={
                          activeKey === 'account' ? 'page' : undefined
                        }
                        isActive={activeKey === 'account'}
                        render={<Link href='/tournament/account' />}
                      >
                        <Link2 aria-hidden='true' size={16} />
                        <span>Connected accounts</span>
                      </SidebarMenuSubButton>
                    </SidebarMenuSubItem>
                  </SidebarMenuSub>
                </Collapsible.Panel>
              </SidebarMenuItem>
            </Collapsible.Root>
          </SidebarMenu>

          {showSignOut ? (
            <div className='px-2'>
              <ClientSignOutButton compact={teamRoom} iconOnly={teamRoom} />
            </div>
          ) : null}
        </SidebarFooter>
        <SidebarRail />
      </Sidebar>

      <SidebarInset>
        <header className='sticky top-0 z-30 border-b border-border bg-background/94 backdrop-blur-xl'>
          <div className='flex min-h-[76px] items-center gap-4 px-[18px] desktop:min-h-[78px] desktop:px-[34px]'>
            <div className='text-foreground desktop:hidden'>
              <DashboardBrand href={homeHref} organizer={organizer} />
            </div>
            <div className='hidden min-w-0 items-center gap-2 font-mono text-[10px] font-semibold tracking-[0.12em] text-muted-foreground desktop:flex'>
              <span>{organizer ? 'CONTROL ROOM' : 'TOURNAMENT'}</span>
              <span aria-hidden='true'>/</span>
              <span className='truncate text-foreground'>{activeLabel}</span>
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
            </div>

            <SidebarTrigger
              aria-label='Open navigation'
              className='ml-auto size-10 rounded-lg border border-border bg-secondary text-foreground focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted desktop:hidden'
            />
          </div>
        </header>
        {children}
      </SidebarInset>
    </>
  );
}
