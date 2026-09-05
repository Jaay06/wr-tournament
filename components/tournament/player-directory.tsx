'use client';

import Link from 'next/link';
import { useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Pencil,
  Search,
  ShieldCheck,
  Swords,
  Users,
} from 'lucide-react';

import { RoleIcon } from '@/components/tournament/role-icon';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button, buttonVariants } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import type {
  TournamentPlayerProfileData,
  TournamentRole,
  TournamentTier,
} from '@/lib/tournament-types';

const tierStyles: Record<TournamentTier, string> = {
  T1: 'border-tier-t1/35 bg-tier-t1/10 text-tier-t1',
  T2: 'border-tier-t2/35 bg-tier-t2/10 text-tier-t2',
  T3: 'border-tier-t3/35 bg-tier-t3/10 text-tier-t3',
  T4: 'border-tier-t4/35 bg-tier-t4/10 text-tier-t4',
};

const previewPlayers: TournamentPlayerProfileData[] = [
  {
    id: 'preview-jinxed',
    displayName: 'Jinxed',
    avatarUrl: null,
    riotName: 'Jinxed',
    riotTag: '0420',
    currentRank: 'Diamond IV',
    approvedTier: 'T3',
    tierStatus: 'approved',
    primaryRole: 'Mid',
    secondaryRole: 'Support',
    team: { id: 'preview-team', name: 'Night Sentinels', status: 'draft' },
  },
  {
    id: 'preview-akin',
    displayName: 'Akin',
    avatarUrl: null,
    riotName: 'Akin',
    riotTag: '1701',
    currentRank: 'Challenger',
    approvedTier: 'T1',
    tierStatus: 'approved',
    primaryRole: 'Baron',
    secondaryRole: 'Mid',
    team: { id: 'preview-team', name: 'Night Sentinels', status: 'draft' },
  },
  {
    id: 'preview-rey',
    displayName: 'Rey',
    avatarUrl: null,
    riotName: 'Rey',
    riotTag: '9301',
    currentRank: 'Diamond II',
    approvedTier: null,
    tierStatus: 'pending',
    primaryRole: 'Jungle',
    secondaryRole: 'Baron',
    team: null,
  },
];

function Kicker({ children, className }: { children: ReactNode; className?: string }) {
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

function PlayerAvatar({
  player,
  className,
}: {
  player: TournamentPlayerProfileData;
  className?: string;
}) {
  return (
    <Avatar className={cn('size-12 font-display text-base font-bold', className)}>
      {player.avatarUrl ? (
        <AvatarImage alt='' src={player.avatarUrl} />
      ) : null}
      <AvatarFallback className='bg-primary-soft text-primary-muted'>
        {player.displayName.slice(0, 1).toUpperCase()}
      </AvatarFallback>
    </Avatar>
  );
}

function TierBadge({ player }: { player: TournamentPlayerProfileData }) {
  if (!player.approvedTier) {
    return (
      <Badge className='h-auto rounded-full border border-warning/25 bg-warning-soft px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em] text-warning'>
        TIER PENDING
      </Badge>
    );
  }

  return (
    <Badge
      className={cn(
        'h-auto rounded-lg border px-2.5 py-1 font-mono text-2xs font-bold',
        tierStyles[player.approvedTier],
      )}
    >
      {player.approvedTier} APPROVED
    </Badge>
  );
}

function RoleValue({ label, role }: { label: string; role: TournamentRole }) {
  return (
    <div className='rounded-xl border border-border bg-secondary/55 p-3'>
      <Kicker>{label}</Kicker>
      <div className='mt-2 flex items-center gap-2 text-sm font-semibold'>
        <RoleIcon className='size-4 text-primary-muted' roleName={role} />
        {role}
      </div>
    </div>
  );
}

function PlayerCard({
  href,
  player,
  isCurrentPlayer,
}: {
  href: string;
  player: TournamentPlayerProfileData;
  isCurrentPlayer: boolean;
}) {
  return (
    <Link
      aria-label={`View ${player.displayName}'s player profile`}
      className='group block min-h-full rounded-card focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-primary-muted'
      href={href}
    >
      <Card className='flex min-h-full flex-col rounded-card border-border bg-card p-5 transition-colors group-hover:border-primary/40'>
        <div className='flex items-start justify-between gap-3'>
          <PlayerAvatar player={player} />
          <div className='flex flex-wrap justify-end gap-2'>
            {isCurrentPlayer ? (
              <Badge className='h-auto rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em] text-primary-muted'>
                YOU
              </Badge>
            ) : null}
            <TierBadge player={player} />
          </div>
        </div>

        <h2 className='mt-5 font-display text-xl font-bold'>{player.displayName}</h2>
        <p className='mt-1 mb-0 font-mono text-xs text-muted-foreground'>
          {player.riotName}#{player.riotTag}
        </p>

        <div className='mt-5 border-y border-border py-4'>
          <Kicker>CURRENT RANK</Kicker>
          <p className='mt-2 mb-0 text-sm font-semibold'>{player.currentRank}</p>
        </div>

        <div className='mt-4 grid grid-cols-2 gap-2'>
          <RoleValue label='PRIMARY' role={player.primaryRole} />
          <RoleValue label='SECONDARY' role={player.secondaryRole} />
        </div>

        <div className='mt-auto flex items-end justify-between gap-3 pt-5'>
          <div className='min-w-0'>
            <Kicker>TEAM</Kicker>
            <p className='mt-1 mb-0 truncate text-sm text-secondary-foreground'>
              {player.team?.name ?? 'No team yet'}
            </p>
          </div>
          <span className='inline-flex shrink-0 items-center gap-1.5 text-sm font-bold text-primary-muted'>
            View <ArrowRight className='transition-transform group-hover:translate-x-0.5' size={15} />
          </span>
        </div>
      </Card>
    </Link>
  );
}

export function PlayerDirectoryView({
  currentRegistrationId,
  players,
}: {
  currentRegistrationId?: string;
  players?: TournamentPlayerProfileData[];
}) {
  const source = players ?? previewPlayers;
  const currentId = currentRegistrationId ?? (players === undefined ? source[0]?.id : undefined);
  const [query, setQuery] = useState('');
  const [tier, setTier] = useState<'all' | 'pending' | TournamentTier>('all');
  const visiblePlayers = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return source.filter((player) => {
      const matchesQuery = [
        player.displayName,
        player.riotName,
        player.riotTag,
        player.currentRank,
        player.primaryRole,
        player.secondaryRole,
        player.team?.name ?? '',
      ]
        .join(' ')
        .toLowerCase()
        .includes(normalized);
      const matchesTier =
        tier === 'all' ||
        (tier === 'pending'
          ? player.tierStatus === 'pending'
          : player.approvedTier === tier);
      return matchesQuery && matchesTier;
    });
  }, [query, source, tier]);

  return (
    <main className='w-full px-[18px] py-[22px] desktop:ml-[244px] desktop:w-[calc(100%-244px)] desktop:px-[34px] desktop:py-7'>
      <div className='flex flex-col gap-6'>
        <div className='flex flex-wrap items-end justify-between gap-5'>
          <div>
            <Kicker className='text-primary-muted'>PLAYER DIRECTORY</Kicker>
            <h1 className='mt-2 max-w-3xl font-display text-[28px] font-bold leading-[1.1] tracking-[-0.035em] desktop:text-[31px]'>
              Find a tournament player
            </h1>
            <p className='mt-3 max-w-2xl text-base leading-6 text-secondary-foreground'>
              Check Riot IDs, current ranks, approved tiers, role preferences, and team membership.
            </p>
          </div>
          <Link
            className={cn(
              buttonVariants({ size: 'lg', variant: 'secondary' }),
              'min-h-11 w-full rounded-xl px-4 py-2.5 text-sm font-bold phone:w-auto',
            )}
            href='/tournament/teams'
          >
            <Swords size={16} /> Browse teams
          </Link>
        </div>

        <Card className='rounded-card border-border bg-card p-4'>
          <label className='relative block'>
            <span className='sr-only'>Search players</span>
            <Search
              aria-hidden='true'
              className='absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground'
              size={17}
            />
            <Input
              aria-label='Search players'
              className='min-h-12 rounded-xl pl-10 text-base'
              onChange={(event) => setQuery(event.target.value)}
              placeholder='Search player, Riot ID, role, rank, or team'
              value={query}
            />
          </label>
          <div className='mt-3 flex flex-wrap gap-2' role='group' aria-label='Tier filters'>
            {(['all', 'T1', 'T2', 'T3', 'T4', 'pending'] as const).map((value) => (
              <Button
                aria-pressed={tier === value}
                className={cn(
                  'min-h-9 rounded-lg border px-3 py-2 text-xs font-semibold',
                  tier === value
                    ? 'border-primary/35 bg-primary-soft text-primary-muted'
                    : 'border-border bg-secondary text-secondary-foreground',
                )}
                key={value}
                onClick={() => setTier(value)}
                size='sm'
                type='button'
              >
                {value === 'all' ? 'All players' : value === 'pending' ? 'Tier pending' : value}
              </Button>
            ))}
          </div>
        </Card>

        <div className='flex items-center justify-between gap-3'>
          <Kicker>{visiblePlayers.length} PLAYERS</Kicker>
          <p className='m-0 text-xs text-muted-foreground'>Tournament participants only</p>
        </div>

        {visiblePlayers.length > 0 ? (
          <>
          <div className='grid gap-3 desktop:hidden'>
            {visiblePlayers.map((player) => (
              <PlayerCard
                href={
                  players === undefined
                    ? '/ui-preview?screen=player-details'
                    : `/tournament/players/${player.id}`
                }
                isCurrentPlayer={player.id === currentId}
                key={player.id}
                player={player}
              />
            ))}
          </div>
          <div className='hidden overflow-hidden rounded-[14px] border border-border bg-card desktop:block'>
            <table className='w-full table-fixed text-left text-sm'>
              <thead className='bg-secondary font-mono text-2xs font-medium uppercase tracking-wider text-muted-foreground'><tr><th className='w-[28%] px-5 py-4'>Player</th><th className='w-[17%] px-3 py-4'>Current rank</th><th className='w-[15%] px-3 py-4'>Approved tier</th><th className='w-[24%] px-3 py-4'>Role preference</th><th className='px-3 py-4'>Team</th></tr></thead>
              <tbody>{visiblePlayers.map(player => <tr className='border-t border-border/50 hover:bg-secondary/50' key={player.id}>
                <td className='px-5 py-4'><Link className='flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-primary' href={players === undefined ? '/ui-preview?screen=player-details' : `/tournament/players/${player.id}`}><PlayerAvatar className='size-8 shrink-0 text-xs' player={player} /><span className='min-w-0'><span className='block truncate font-semibold'>{player.displayName}{player.id === currentId ? ' (you)' : ''}</span><span className='mt-1 block truncate text-xs text-muted-foreground'>{player.riotName}#{player.riotTag}</span></span></Link></td>
                <td className='px-3 py-4 text-secondary-foreground'>{player.currentRank}</td><td className='px-3 py-4'><TierBadge player={player} /></td>
                <td className='px-3 py-4'><span className='flex flex-wrap items-center gap-1.5 text-xs text-secondary-foreground'><RoleIcon className='size-4 text-role-icon' roleName={player.primaryRole} />{player.primaryRole}<span className='text-muted-foreground'>/</span><RoleIcon className='size-4 text-role-icon' roleName={player.secondaryRole} />{player.secondaryRole}</span></td>
                <td className='px-3 py-4'>{player.team ? <Link className='text-xs hover:text-primary' href={`/tournament/teams/${player.team.id}`}>{player.team.name}</Link> : <span className='text-xs text-success'>Open</span>}</td>
              </tr>)}</tbody>
            </table>
          </div>
          </>
        ) : (
          <Empty className='rounded-card border border-dashed border-border-strong bg-secondary/45 p-8'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <Search size={16} />
              </EmptyMedia>
              <EmptyTitle className='font-display text-xl font-bold'>
                No players match
              </EmptyTitle>
              <EmptyDescription>
                Change the search or choose another tier.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </div>
    </main>
  );
}

export function PlayerDetailsView({
  currentRegistrationId,
  playerProfile,
}: {
  currentRegistrationId?: string;
  playerProfile?: TournamentPlayerProfileData | null;
}) {
  const player = playerProfile ?? previewPlayers[0];
  const isCurrentPlayer =
    player.id === (currentRegistrationId ?? (playerProfile === undefined ? player.id : undefined));

  return (
    <main className='w-full px-[18px] py-[22px] desktop:ml-[244px] desktop:w-[calc(100%-244px)] desktop:px-[34px] desktop:py-7'>
      <div className='flex flex-col gap-6'>
        <Link
          className='-mx-2 inline-flex min-h-11 w-fit items-center gap-2 rounded-lg px-2 text-sm font-bold text-secondary-foreground hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-primary-muted'
          href='/tournament/players'
        >
          <ArrowLeft size={16} /> Back to players
        </Link>

        <Card className='overflow-hidden rounded-card border-border bg-card'>
          <div className='grid min-w-0 tablet:grid-cols-[minmax(0,1.35fr)_minmax(280px,0.65fr)]'>
            <div className='min-w-0 p-5 tablet:p-7'>
              <div className='flex flex-col items-start gap-4 phone:flex-row phone:flex-wrap phone:justify-between'>
                <PlayerAvatar className='size-16 text-xl' player={player} />
                <div className='flex flex-wrap gap-2'>
                  {isCurrentPlayer ? (
                    <Badge className='h-auto rounded-full border border-primary/30 bg-primary-soft px-2.5 py-1 font-mono text-2xs font-semibold tracking-[0.08em] text-primary-muted'>
                      YOUR PROFILE
                    </Badge>
                  ) : null}
                  <TierBadge player={player} />
                </div>
              </div>

              <Kicker className='mt-7 text-primary-muted'>PLAYER CARD</Kicker>
              <h1 className='mt-3 break-words font-display text-[32px] font-bold leading-[1.05] tracking-[-0.04em] phone:text-3xl desktop:text-[46px]'>
                {player.displayName}
              </h1>
              <p className='mt-2 mb-0 break-all font-mono text-sm text-muted-foreground'>
                {player.riotName}#{player.riotTag}
              </p>

              <div className='mt-7 grid gap-3 tablet:grid-cols-2'>
                <RoleValue label='PRIMARY ROLE' role={player.primaryRole} />
                <RoleValue label='SECONDARY ROLE' role={player.secondaryRole} />
              </div>
            </div>

            <div className='border-t border-border bg-secondary/45 p-5 tablet:border-t-0 tablet:border-l tablet:p-7'>
              <Kicker>TOURNAMENT DETAILS</Kicker>
              <dl className='mt-5 space-y-5'>
                <div>
                  <dt className='font-mono text-2xs font-semibold tracking-[0.12em] text-muted-foreground'>
                    CURRENT RANK
                  </dt>
                  <dd className='mt-2 text-base font-semibold'>{player.currentRank}</dd>
                </div>
                <div className='border-t border-border pt-5'>
                  <dt className='font-mono text-2xs font-semibold tracking-[0.12em] text-muted-foreground'>
                    TEAM
                  </dt>
                  <dd className='mt-2 text-base font-semibold'>
                    {player.team?.name ?? 'No team yet'}
                  </dd>
                  {player.team ? (
                    <p className='mt-1 mb-0 text-xs text-muted-foreground'>
                      {player.team.status === 'submitted' ? 'Submitted roster' : 'Draft roster'}
                    </p>
                  ) : null}
                </div>
              </dl>

              <div className='mt-7 flex flex-col gap-3'>
                {isCurrentPlayer ? (
                  <Link
                    className={cn(
                      buttonVariants({ size: 'lg' }),
                      'min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold shadow-lg shadow-primary/20',
                    )}
                    href='/tournament/profile'
                  >
                    <Pencil size={16} /> Edit rank and roles
                  </Link>
                ) : null}
                {player.team ? (
                  <Link
                    className={cn(
                      buttonVariants({ size: 'lg', variant: 'secondary' }),
                      'min-h-11 rounded-xl px-4 py-2.5 text-sm font-bold',
                    )}
                    href={`/tournament/teams/${player.team.id}`}
                  >
                    <Users size={16} /> View team
                  </Link>
                ) : null}
              </div>
            </div>
          </div>
        </Card>

        <Card className='rounded-card border-success/20 bg-success-soft/50 p-5'>
          <div className='flex items-start gap-3'>
            {player.tierStatus === 'approved' ? (
              <CheckCircle2 className='mt-0.5 shrink-0 text-success' size={19} />
            ) : (
              <ShieldCheck className='mt-0.5 shrink-0 text-warning' size={19} />
            )}
            <div>
              <p className='m-0 text-sm font-semibold'>
                {player.tierStatus === 'approved'
                  ? `${player.approvedTier} is the approved tournament tier`
                  : 'Tier review is pending'}
              </p>
              <p className='mt-1 mb-0 text-xs leading-5 text-secondary-foreground'>
                {isCurrentPlayer
                  ? 'You can change your rank, self tier, and preferred roles from Edit rank and roles before registration closes.'
                  : 'The organizer controls tier approval. Role preferences come from the player registration.'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
