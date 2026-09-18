'use client';

import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import { useRouter } from 'next/navigation';
import {
  useActionState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArrowDown,
  ArrowUp,
  Check,
  Clock3,
  Crown,
  Eye,
  LockKeyhole,
  Pause,
  Play,
  Search,
  RotateCcw,
  Swords,
  Undo2,
  Users,
} from 'lucide-react';

import {
  adjustCaptainDraftTimer,
  organizerPickDraftPlayer,
  pauseCaptainDraft,
  pickDraftPlayer,
  resumeCaptainDraft,
  restartCaptainDraft,
  startCaptainDraft,
  undoCaptainDraftPick,
  type DraftActionState,
} from '@/app/draft/actions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { draftTeamName, draftTeamSizes } from '@/lib/draft-setup';
import { cn } from '@/lib/utils';
import { createDraftPoller } from '@/lib/draft-poll-client';
import { draftDirectionLabel, draftRoundLabel } from '@/lib/snake-draft';
import type {
  DraftBoardData,
  DraftPlayerData,
  DraftStatus,
} from '@/lib/tournament-types';

import {
  Avatar,
  Card as SharedCard,
  Kicker,
  PageFrame,
  SectionHeading,
  StatusPill,
  tierMeta,
} from './tournament-app-shared';
import type { TournamentAppProps } from './tournament-app-shared';
import { TournamentAppRouteFrame } from './tournament-app-route-frame';

const easeOutExpo = [0.19, 1, 0.22, 1] as const;

function formatSeconds(seconds: number) {
  const safe = Math.max(0, seconds);
  return `00:${safe.toString().padStart(2, '0')}`;
}

function useDraftClock(board: DraftBoardData | null) {
  const [now, setNow] = useState(() => Date.now());
  const active = board?.status === 'active';
  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setInterval> | undefined;
    const sync = () => {
      clearInterval(timer);
      if (document.visibilityState === 'visible') {
        setNow(Date.now());
        timer = setInterval(() => setNow(Date.now()), 1000);
      }
    };
    sync();
    document.addEventListener('visibilitychange', sync);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', sync);
    };
  }, [active]);

  if (!board) return 0;
  if (board.status === 'paused') return board.pausedRemainingSeconds ?? 0;
  if (board.status !== 'active') return 0;
  return Math.max(
    0,
    Math.ceil((new Date(board.turnEndsAt).getTime() - now) / 1000),
  );
}

function useDraftRefresh(initialBoard: DraftBoardData | null | undefined) {
  const [snapshot, setSnapshot] = useState({ source: initialBoard, board: initialBoard ?? null });
  // A server refresh supplies a new source. Adjust during render rather than
  // painting the old board and triggering a second render from an effect.
  if (snapshot.source !== initialBoard) {
    setSnapshot({ source: initialBoard, board: initialBoard ?? null });
  }
  const poller = useMemo(() => createDraftPoller({
    onBoard(next) {
      setSnapshot(current => current.source === initialBoard
        ? { source: initialBoard, board: next } : current);
    },
    isVisible: () => document.visibilityState === 'visible' && navigator.onLine,
    subscribe(onVisible) {
      document.addEventListener('visibilitychange', onVisible);
      window.addEventListener('online', onVisible);
      return () => {
        document.removeEventListener('visibilitychange', onVisible);
        window.removeEventListener('online', onVisible);
      };
    },
  }), [initialBoard]);
  useEffect(() => poller.start(), [poller]);
  return { board: snapshot.board, refresh: poller.refresh };
}

function DraftStatusPill({ status }: { status: DraftStatus }) {
  if (status === 'active')
    return <StatusPill tone='success'>LIVE DRAFT</StatusPill>;
  if (status === 'paused')
    return <StatusPill tone='warning'>PAUSED</StatusPill>;
  if (status === 'needs_repair')
    return <StatusPill tone='danger'>REPAIR NEEDED</StatusPill>;
  return <StatusPill tone='neutral'>COMPLETE</StatusPill>;
}

function EmptyDraftRoom({ organizer = false }: { organizer?: boolean }) {
  return (
    <PageFrame>
      <div className='mx-auto max-w-3xl'>
        <SectionHeading
          detail={
            organizer
              ? 'Choose captains to create balanced teams and begin the shared draft.'
              : 'The organizer will publish the shared board here when the captain draft begins.'
          }
          eyebrow={
            organizer ? 'CONTROL ROOM / DRAFT SETUP' : 'TOURNAMENT / DRAFT ROOM'
          }
          title={
            organizer ? 'Choose how teams will form.' : 'Draft room not started'
          }
        />
        <SharedCard className='mt-7 border-border bg-card p-6 desktop:p-8'>
          <div className='flex items-start gap-4'>
            <div className='flex size-11 shrink-0 items-center justify-center rounded-xl border border-primary/30 bg-primary-soft text-primary'>
              <Swords aria-hidden='true' size={20} />
            </div>
            <div>
              <p className='m-0 text-base font-semibold'>Captain snake draft</p>
              <p className='mt-2 mb-0 max-w-xl text-sm leading-6 text-secondary-foreground'>
                One player is selected per turn. The order reverses after each
                round, and every pick is confirmed by the server for everyone in
                the room.
              </p>
            </div>
          </div>
        </SharedCard>
      </div>
    </PageFrame>
  );
}

function DraftHeader({
  board,
  organizer,
}: {
  board: DraftBoardData;
  organizer: boolean;
}) {
  const timer = useDraftClock(board);
  return (
    <>
      <div className='flex flex-col gap-5 border-b border-border pb-6 desktop:flex-row desktop:items-end desktop:justify-between'>
        <div>
          <Kicker className='text-primary-muted'>
            {organizer
              ? 'CONTROL ROOM / DRAFT ROOM'
              : 'PLAYER DRAFT / SNAKE ORDER'}
          </Kicker>
          <h1 className='mt-3 font-display text-3xl font-bold tracking-tight desktop:text-4xl'>
            {organizer ? 'Run the draft, pick by pick.' : 'Player draft'}
          </h1>
          <p className='mt-2 max-w-2xl text-sm leading-6 text-secondary-foreground'>
            Each team keeps a readable column. The server owns the order, timer,
            and roster locks while the room stays in sync.
          </p>
        </div>
        <div className='flex items-center gap-2 self-start desktop:self-auto'>
          <DraftStatusPill status={board.status} />
          <Badge className='border border-primary/35 bg-primary-soft px-3 py-1.5 font-mono text-2xs font-semibold tracking-[0.1em] text-primary'>
            PICK {board.turnNumber.toString().padStart(2, '0')}
          </Badge>
        </div>
      </div>

      <MobileTurnCard board={board} />

      <div className='hidden md:grid gap-3 tablet:grid-cols-2 desktop:grid-cols-4'>
        <InfoStat
          label='TIER PHASE'
          value={`${board.currentTier} / ELIGIBLE POOL`}
        />
        <InfoStat
          label='ROUND'
          value={`${board.currentTierRound} · ${draftRoundLabel({ tier: board.currentTier, tierRound: board.currentTierRound })}`}
        />
        <InfoStat
          active
          label='DIRECTION'
          value={`${draftDirectionLabel(board.direction).toUpperCase()} / ${board.direction === 'forward' ? '→' : '←'}`}
        />
        <InfoStat
          label='TURN TIMER'
          value={
            board.status === 'paused'
              ? `PAUSED · ${formatSeconds(timer)}`
              : formatSeconds(timer)
          }
        />
      </div>
    </>
  );
}

function InfoStat({
  label,
  value,
  active = false,
}: {
  label: string;
  value: string;
  active?: boolean;
}) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-card px-4 py-3.5',
        active && 'border-primary/70',
      )}
    >
      <p className='m-0 font-mono text-3xs font-semibold tracking-[0.2em] text-muted-foreground'>
        {label}
      </p>
      <p
        className={cn(
          'mt-2 mb-0 text-sm font-semibold',
          active ? 'text-primary' : 'text-foreground',
        )}
      >
        {value}
      </p>
    </div>
  );
}

function PickCard({
  player,
  selected,
  onSelect,
  disabled,
}: {
  player: DraftPlayerData;
  selected: boolean;
  onSelect: () => void;
  disabled: boolean;
}) {
  return (
    <button
      aria-pressed={selected}
      className={cn(
        'flex min-h-16 w-full items-center gap-3 rounded-xl border bg-secondary px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-150 ease-out-quad active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-50',
        selected
          ? 'border-primary bg-primary-soft'
          : 'border-border hover:border-border-strong hover:bg-secondary/80',
      )}
      disabled={disabled || !player.available}
      onClick={onSelect}
      type='button'
    >
      <Avatar
        player={{
          name: player.displayName,
          riotId: `${player.riotName}#${player.riotTag}`,
          rank: player.currentRank,
          tier: player.approvedTier,
          primaryRole: player.primaryRole,
          secondaryRole: player.secondaryRole,
          initial: player.displayName.slice(0, 1).toUpperCase(),
          avatarClass: `${tierMeta[player.approvedTier].soft} ${tierMeta[player.approvedTier].text}`,
        }}
        size='size-9'
      />
      <span className='min-w-0 flex-1'>
        <span className='block truncate text-sm font-semibold text-foreground'>
          {player.displayName}
        </span>
        <span className='mt-1 flex items-center gap-1.5 text-[10px] text-muted-foreground'>
          <span>{player.approvedTier}</span>
          <span aria-hidden='true'>·</span>
          <span>
            {player.primaryRole} / {player.secondaryRole}
          </span>
        </span>
      </span>
      {selected ? (
        <Check aria-hidden='true' className='shrink-0 text-primary' size={17} />
      ) : null}
    </button>
  );
}

function DraftPickSurface({
  board,
  onRefresh,
  organizer,
}: {
  board: DraftBoardData;
  onRefresh: () => Promise<void>;
  organizer: boolean;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [requestKey, setRequestKey] = useState(() => crypto.randomUUID());
  const pickServerAction = organizer
    ? organizerPickDraftPlayer
    : pickDraftPlayer;
  const pickActionHandler = useCallback(
    async (previousState: DraftActionState, formData: FormData) => {
      const result = await pickServerAction(previousState, formData);
      if (result.success) {
        setSelected(null);
        setRequestKey(crypto.randomUUID());
        await onRefresh();
      }
      return result;
    },
    [pickServerAction, onRefresh],
  );
  const [pickState, pickAction] = useActionState<DraftActionState, FormData>(
    pickActionHandler,
    {},
  );
  const reduceMotion = useReducedMotion();
  const available = useMemo(
    () =>
      board.players.filter(
        (player) =>
          player.available &&
          player.approvedTier === board.currentTier &&
          `${player.displayName} ${player.riotName}`
            .toLowerCase()
            .includes(search.toLowerCase()),
      ),
    [board.currentTier, board.players, search],
  );
  const timer = useDraftClock(board);

  return (
    <div className='grid gap-4 desktop:grid-cols-[minmax(0,1.3fr)_minmax(320px,0.7fr)]'>
      <SharedCard className='p-4 desktop:p-6'>
        <div className='flex flex-wrap items-start justify-between gap-3'>
          <div>
            <Kicker className='text-primary-muted'>AVAILABLE PLAYERS</Kicker>
            <p className='mt-2 mb-0 font-display text-xl font-bold'>
              {board.currentTier} pool
            </p>
            <p className='mt-1 mb-0 text-xs text-muted-foreground'>
              Only this tier is eligible for the current turn.
            </p>
          </div>
          <div className='relative w-full tablet:w-48'>
            <Search
              aria-hidden='true'
              className='absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground'
              size={15}
            />
            <Input
              aria-label='Search available players'
              className='h-10 rounded-lg pl-9 text-xs'
              onChange={(event) => setSearch(event.target.value)}
              placeholder='Search players'
              value={search}
            />
          </div>
        </div>

        <div className='mt-5 flex flex-col gap-2.5'>
          {available.length > 0 ? (
            available.map((player) => (
              <PickCard
                disabled={
                  board.status !== 'active' ||
                  (!organizer && !board.viewer.isCurrentCaptain)
                }
                key={player.registrationId}
                onSelect={() => setSelected(player.registrationId)}
                player={player}
                selected={selected === player.registrationId}
              />
            ))
          ) : (
            <div className='rounded-xl border border-dashed border-border px-4 py-8 text-center'>
              <p className='m-0 text-sm font-semibold'>
                No eligible players remain in {board.currentTier}.
              </p>
              <p className='mt-2 mb-0 text-xs leading-5 text-muted-foreground'>
                The server will advance the tier when the current pool is
                exhausted.
              </p>
            </div>
          )}
        </div>

        <div className='mt-5 flex flex-col gap-3 border-t border-border pt-4 tablet:flex-row tablet:items-center tablet:justify-between'>
          <p className='m-0 text-xs text-muted-foreground'>
            {selected
              ? 'Selected player is ready to confirm.'
              : 'Select a player to confirm this turn.'}
          </p>
          <form action={pickAction}>
            <input name='sessionId' type='hidden' value={board.id} />
            <input name='registrationId' type='hidden' value={selected ?? ''} />
            <input name='expectedVersion' type='hidden' value={board.version} />
            <input name='requestKey' type='hidden' value={requestKey} />
            <Button
              className='min-h-11 w-full bg-primary text-primary-foreground hover:bg-primary-hover tablet:w-auto'
              disabled={
                !selected ||
                board.status !== 'active' ||
                (!organizer && !board.viewer.isCurrentCaptain)
              }
              size='lg'
              type='submit'
            >
              <Swords aria-hidden='true' size={16} />
              {organizer ? 'Pick for captain' : 'Confirm pick'}
            </Button>
          </form>
        </div>
        {pickState.error ? (
          <Alert aria-live='polite' className='mt-4' variant='destructive'>
            <AlertDescription>{pickState.error}</AlertDescription>
          </Alert>
        ) : null}
        {pickState.success ? (
          <Alert
            aria-live='polite'
            className='mt-4 border-success/30 bg-success-soft text-success'
          >
            <AlertDescription className='text-success'>
              {pickState.success}
            </AlertDescription>
          </Alert>
        ) : null}
      </SharedCard>

      <RosterSnapshot
        board={board}
        timer={timer}
        reduceMotion={Boolean(reduceMotion)}
      />
    </div>
  );
}

function RosterSnapshot({
  board,
  timer,
  reduceMotion,
}: {
  board: DraftBoardData;
  timer: number;
  reduceMotion: boolean;
}) {
  return (
    <SharedCard className='p-4 desktop:p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div>
          <Kicker className='text-primary-muted'>ROSTER SNAPSHOT</Kicker>
          <p className='mt-2 mb-0 text-base font-semibold'>
            {board.currentCaptainName ?? 'Draft complete'}
          </p>
        </div>
        <div className='text-right'>
          <p className='m-0 font-mono text-3xs tracking-[0.16em] text-muted-foreground'>
            TURN TIMER
          </p>
          <p
            className={cn(
              'mt-1 mb-0 font-mono text-sm font-semibold',
              timer <= 10 ? 'text-danger' : 'text-primary',
            )}
          >
            {board.status === 'paused' ? 'PAUSED' : formatSeconds(timer)}
          </p>
        </div>
      </div>
      <div className='mt-5 flex flex-col gap-2'>
        {board.teams.map((team) => (
          <div
            className={cn(
              'rounded-xl border border-border bg-secondary px-3.5 py-3',
              team.id === board.currentTeamId &&
                'border-primary/70 bg-primary-soft',
            )}
            key={team.id}
          >
            <div className='flex items-center justify-between gap-3'>
              <p className='m-0 truncate text-sm font-semibold'>{team.name}</p>
              <span className='shrink-0 font-mono text-[10px] text-muted-foreground'>
                {team.memberCount} / {team.targetMemberCount}
              </span>
            </div>
            <div className='mt-1.5 flex items-center gap-2 text-[10px] text-muted-foreground'>
              <span>{team.captainName}</span>
              <span aria-hidden='true'>·</span>
              <span>
                {team.tierCounts.T1} T1 / {team.tierCounts.T2} T2
              </span>
            </div>
            {team.id === board.currentTeamId ? (
              <p className='mt-2 mb-0 font-mono text-3xs font-semibold tracking-[0.16em] text-primary'>
                CURRENT CAPTAIN
              </p>
            ) : null}
          </div>
        ))}
      </div>
      <p className='mt-5 mb-0 border-t border-border pt-4 text-xs leading-5 text-muted-foreground'>
        At least six players per team, including the captain. Full teams skip turns.
      </p>
      <AnimatePresence initial={false} mode='wait'>
        {board.status === 'active' ? (
          <motion.div
            animate={{ opacity: 1, transform: 'translateY(0)' }}
            className='mt-4 flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-xs text-secondary-foreground'
            initial={
              reduceMotion
                ? { opacity: 0 }
                : { opacity: 0, transform: 'translateY(6px)' }
            }
            key={`${board.currentTeamId}-${board.currentTier}`}
            transition={{ duration: 0.15, ease: easeOutExpo }}
          >
            <Clock3 aria-hidden='true' className='text-primary' size={14} />
            <span>Next pick is confirmed by the server.</span>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </SharedCard>
  );
}

function DraftBoard({
  board,
  organizer,
}: {
  board: DraftBoardData;
  organizer: boolean;
}) {
  const currentRef = useRef<HTMLDivElement>(null);
  const [jumped, setJumped] = useState(false);
  const activePicks = board.picks.filter((pick) => !pick.undoneAt);
  const maxRound = Math.max(
    board.currentRound + 1,
    ...activePicks.map((pick) => pick.round),
    4,
  );
  const rows = Array.from({ length: maxRound }, (_, index) => index + 1);

  function jumpToCurrent() {
    currentRef.current?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'center',
    });
    setJumped(true);
    window.setTimeout(() => setJumped(false), 900);
  }

  return (
    <SharedCard className='overflow-hidden p-4 desktop:p-6'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <Kicker className='text-primary-muted'>LIVE DRAFT BOARD</Kicker>
          <p className='mt-2 mb-0 font-display text-xl font-bold'>
            Shared live board
          </p>
          <p className='mt-1 mb-0 text-xs text-muted-foreground'>
            Everyone sees the same server-confirmed order.
          </p>
        </div>
        <Button
          className='min-h-10 gap-2 rounded-lg border border-border bg-secondary text-xs text-foreground hover:border-border-strong'
          onClick={jumpToCurrent}
          size='sm'
          type='button'
          variant='secondary'
        >
          <Eye aria-hidden='true' size={14} />
          {jumped ? 'Current pick' : 'Jump to current'}
        </Button>
      </div>

      <div
        className='mt-5 overflow-x-auto rounded-xl border border-border bg-background'
        ref={currentRef}
      >
        <div className='min-w-[880px]'>
          <div
            className='grid grid-cols-[96px_repeat(var(--team-count),minmax(142px,1fr))]'
            style={
              { '--team-count': board.teams.length } as React.CSSProperties
            }
          >
            <div className='sticky left-0 z-20 border-b border-border bg-background px-3 py-4 font-mono text-3xs font-semibold tracking-[0.18em] text-muted-foreground'>
              ROUND / PATH
            </div>
            {board.teams.map((team) => (
              <div
                className={cn(
                  'border-b border-l border-border bg-card px-3 py-3',
                  team.id === board.currentTeamId && 'bg-primary-soft',
                )}
                key={team.id}
              >
                <p className='m-0 truncate text-xs font-semibold'>
                  {team.name}
                </p>
                <p className='mt-1 truncate font-mono text-3xs tracking-[0.08em] text-muted-foreground'>
                  {team.captainName}
                </p>
              </div>
            ))}
          </div>

          {rows.map((round) => {
            const direction = round % 2 === 1 ? 'FORWARD' : 'REVERSE';
            return (
              <div
                className='grid grid-cols-[96px_repeat(var(--team-count),minmax(142px,1fr))]'
                key={round}
                style={
                  { '--team-count': board.teams.length } as React.CSSProperties
                }
              >
                <div className='sticky left-0 z-10 border-b border-border bg-background px-3 py-4'>
                  <p className='m-0 font-mono text-3xs font-semibold tracking-[0.16em] text-muted-foreground'>
                    ROUND {round}
                  </p>
                  <p className='mt-1 mb-0 font-mono text-3xs text-muted-foreground'>
                    {direction} {direction === 'FORWARD' ? '→' : '←'}
                  </p>
                </div>
                {board.teams.map((team, index) => {
                  const pick = activePicks.find(
                    (candidate) =>
                      candidate.round === round && candidate.teamId === team.id,
                  );
                  const current =
                    board.currentTeamId === team.id &&
                    board.currentRound === round;
                  const slotNumber =
                    (round - 1) * board.teams.length +
                    (round % 2 === 1 ? index + 1 : board.teams.length - index);
                  return (
                    <div
                      className={cn(
                        'border-b border-l border-border px-2 py-2',
                        current && 'bg-primary-soft',
                      )}
                      key={`${round}-${team.id}-${pick?.id ?? 'empty'}`}
                    >
                      <motion.div
                        animate={{ opacity: 1, transform: 'translateY(0)' }}
                        className={cn(
                          'min-h-20 rounded-lg border px-3 py-3',
                          current
                            ? 'border-primary bg-primary-soft'
                            : 'border-border bg-card',
                        )}
                        initial={
                          pick
                            ? { opacity: 0, transform: 'translateY(6px)' }
                            : false
                        }
                        transition={{ duration: 0.18, ease: easeOutExpo }}
                      >
                        <p className='m-0 font-mono text-3xs font-semibold tracking-[0.1em] text-muted-foreground'>
                          {slotNumber.toString().padStart(2, '0')} /{' '}
                          {pick ? 'PICKED' : current ? 'NOW' : 'OPEN SLOT'}
                        </p>
                        <p
                          className={cn(
                            'mt-2 mb-0 truncate text-xs font-semibold',
                            current ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {pick?.displayName ??
                            (current ? 'Captain picking' : 'Awaiting turn')}
                        </p>
                        <p className='mt-1 mb-0 truncate text-[10px] text-muted-foreground'>
                          {pick
                            ? `${pick.tier} · ${pick.source === 'auto' ? 'auto-picked' : 'confirmed'}`
                            : current
                              ? `${board.currentTier} / ${board.currentCaptainName ?? 'captain'}`
                              : team.captainName}
                        </p>
                      </motion.div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
      <div className='mt-3 flex flex-wrap items-center justify-between gap-2 text-[10px] text-muted-foreground'>
        <span>
          {board.teams.length} teams · snake direction changes after each round
        </span>
        <span>
          {organizer
            ? 'Organizer controls are below.'
            : 'Current turn and next captain update automatically.'}
        </span>
      </div>
    </SharedCard>
  );
}

function OrganizerControls({
  board,
  onRefresh,
  onRebuild,
}: {
  board: DraftBoardData;
  onRefresh: () => Promise<void>;
  onRebuild: () => void;
}) {
  const runAndRefresh = useCallback(
    async (
      action: (state: DraftActionState, data: FormData) => Promise<DraftActionState>,
      state: DraftActionState,
      data: FormData,
    ) => {
      const result = await action(state, data);
      if (result.success) await onRefresh();
      return result;
    },
    [onRefresh],
  );
  const [pauseState, pauseAction] = useActionState<DraftActionState, FormData>(
    (state, data) => runAndRefresh(pauseCaptainDraft, state, data), {},
  );
  const [resumeState, resumeAction] = useActionState<DraftActionState, FormData>(
    (state, data) => runAndRefresh(resumeCaptainDraft, state, data), {},
  );
  const [timerState, timerAction] = useActionState<DraftActionState, FormData>(
    (state, data) => runAndRefresh(adjustCaptainDraftTimer, state, data), {},
  );
  const [undoState, undoAction] = useActionState<DraftActionState, FormData>(
    (state, data) => runAndRefresh(undoCaptainDraftPick, state, data), {},
  );

  const [restartOpen, setRestartOpen] = useState(false);
  const [restartState, restartAction, restarting] = useActionState<DraftActionState, FormData>(
    async (state, data) => {
      const result = await runAndRefresh(restartCaptainDraft, state, data);
      setRestartOpen(false);
      return result;
    }, {},
  );

  return (
    <SharedCard className='border-primary/20 bg-card p-4 desktop:p-5'>
      <div className='flex flex-wrap items-start justify-between gap-3'>
        <div>
          <Kicker className='text-primary-muted'>ORGANIZER CONTROLS</Kicker>
          <p className='mt-2 mb-0 text-base font-semibold'>
            Keep the room moving
          </p>
          <p className='mt-1 mb-0 text-xs leading-5 text-muted-foreground'>
            Controls are server-checked and visible only to the organizer.
          </p>
        </div>
        <LockKeyhole aria-hidden='true' className='text-primary' size={18} />
      </div>
      <div className='mt-4 flex flex-wrap gap-2'>
        {board.status === 'active' || board.status === 'paused' ? (
          <>
            <form
              action={board.status === 'paused' ? resumeAction : pauseAction}
            >
              <input name='sessionId' type='hidden' value={board.id} />
              <Button
                className='min-h-10 gap-2 border border-border bg-secondary text-xs text-foreground hover:border-border-strong'
                size='sm'
                type='submit'
                variant='secondary'
              >
                {board.status === 'paused' ? (
                  <Play size={14} />
                ) : (
                  <Pause size={14} />
                )}
                {board.status === 'paused' ? 'Resume' : 'Pause'}
              </Button>
            </form>
            <form action={timerAction}>
              <input name='sessionId' type='hidden' value={board.id} />
              <input name='deltaSeconds' type='hidden' value='-15' />
              <Button
                aria-label='Subtract 15 seconds'
                className='min-h-10 gap-2 border border-border bg-secondary text-xs text-foreground hover:border-border-strong'
                size='sm'
                type='submit'
                variant='secondary'
              >
                <ArrowDown size={14} /> -15s
              </Button>
            </form>
            <form action={timerAction}>
              <input name='sessionId' type='hidden' value={board.id} />
              <input name='deltaSeconds' type='hidden' value='15' />
              <Button
                aria-label='Add 15 seconds'
                className='min-h-10 gap-2 border border-border bg-secondary text-xs text-foreground hover:border-border-strong'
                size='sm'
                type='submit'
                variant='secondary'
              >
                <ArrowUp size={14} /> +15s
              </Button>
            </form>
          </>
        ) : null}
        <form action={undoAction}>
          <input name='sessionId' type='hidden' value={board.id} />
          <Button
            className='min-h-10 gap-2 border border-danger/30 bg-danger-soft text-xs text-danger hover:bg-danger-soft/70'
            disabled={!board.viewer.canUndo}
            size='sm'
            type='submit'
            variant='secondary'
          >
            <Undo2 size={14} /> Undo latest
          </Button>
        </form>
        <Button type='button' variant='secondary' size='sm' onClick={onRebuild}>
          Set up new teams
        </Button>
        <AlertDialog open={restartOpen} onOpenChange={setRestartOpen}>
          <AlertDialogTrigger render={<Button type='button' size='sm' variant='secondary' disabled={restarting}
            className='min-h-10 gap-2 border border-danger/30 bg-danger-soft text-xs text-danger hover:bg-danger-soft/70' />}>
            <RotateCcw size={14} /> Restart draft
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Restart this draft?</AlertDialogTitle>
              <AlertDialogDescription>
                All picks will be cleared and drafted players returned to the pool.
                Captains and team order stay the same. Submitted rosters will be unlocked.
                The draft will pause with a fresh 60-second timer until you resume it.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={restarting}>Keep draft</AlertDialogCancel>
              <form action={restartAction}>
                <input name='sessionId' type='hidden' value={board.id} />
                <input name='expectedVersion' type='hidden' value={board.version} />
                <AlertDialogAction type='submit' variant='destructive' disabled={restarting}>
                  {restarting ? 'Restarting…' : 'Restart draft'}
                </AlertDialogAction>
              </form>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
      {restartState.error && <p role='alert' className='mt-3 text-xs text-danger'>{restartState.error}</p>}
      {restartState.success && <p role='status' className='mt-3 text-xs text-success'>{restartState.success}</p>}
      {pauseState.error ||
      resumeState.error ||
      timerState.error ||
      undoState.error ? (
        <p aria-live='polite' className='mt-3 mb-0 text-xs text-danger'>
          {pauseState.error ||
            resumeState.error ||
            timerState.error ||
            undoState.error}
        </p>
      ) : null}
      {pauseState.success ||
      resumeState.success ||
      timerState.success ||
      undoState.success ? (
        <p aria-live='polite' className='mt-3 mb-0 text-xs text-success'>
          {pauseState.success ||
            resumeState.success ||
            timerState.success ||
            undoState.success}
        </p>
      ) : null}
    </SharedCard>
  );
}

function DraftSetup({
  players,
  previousDraft,
  onCancel,
  onStarted,
}: {
  players: NonNullable<TournamentAppProps['draftSetupPlayers']>;
  previousDraft?: DraftBoardData;
  onCancel?: () => void;
  onStarted?: () => void;
}) {
  const router = useRouter();
  const [captains, setCaptains] = useState<Record<number, string>>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [state, formAction, pending] = useActionState<DraftActionState, FormData>(
    async (previous, data) => {
      const result = await startCaptainDraft(previous, data);
      setConfirmOpen(false);
      if (result.success) {
        onStarted?.();
        router.refresh();
      }
      return result;
    }, {},
  );
  const sizes = draftTeamSizes(players.length);
  const ready = sizes.length > 0 && sizes.every((_, index) =>
    players.some((player) => player.id === captains[index]),
  ) && new Set(sizes.map((_, index) => captains[index])).size === sizes.length;

  return (
    <PageFrame>
      <div className='mx-auto max-w-6xl'>
        <SectionHeading
          detail='Teams are created from all approved players, including players already on a roster.'
          eyebrow='TEAM FORMATION'
          title='Choose your captains.'
        />
        {onCancel && <Button type='button' variant='secondary' className='mt-4' onClick={onCancel}>Back to draft</Button>}
        <form action={formAction} id='start-captain-draft' className='mt-7 grid gap-4 desktop:grid-cols-[minmax(0,1.2fr)_minmax(320px,0.8fr)]'>
          {previousDraft && <>
            <input type='hidden' name='sessionId' value={previousDraft.id} />
            <input type='hidden' name='expectedVersion' value={previousDraft.version} />
          </>}
          <SharedCard className='p-5 desktop:p-6'>
            <Kicker className='text-primary-muted'>AUTOMATIC TEAMS</Kicker>
            <p className='mt-2 text-base font-semibold'>
              {players.length} approved players · {sizes.length} teams
            </p>
            <p className='mt-1 text-sm leading-6 text-secondary-foreground'>
              Select one captain per team. Each roster has at least six players,
              including its captain. Extra players are distributed evenly.
            </p>
            <div className='mt-5 flex flex-col gap-4'>
              {sizes.map((_, index) => (
                <div key={index} className='rounded-xl border border-border bg-secondary p-4'>
                  <label htmlFor={`captain-${index}`} className='mb-2 block text-sm font-semibold'>
                    {draftTeamName(index)} · {Math.min(...sizes)}{Math.max(...sizes) !== Math.min(...sizes) ? `–${Math.max(...sizes)}` : ''} players
                  </label>
                  <NativeSelect id={`captain-${index}`} name='captainId' required
                    value={captains[index] ?? ''} disabled={pending}
                    onChange={(event) => setCaptains((current) => ({ ...current, [index]: event.target.value }))}>
                    <NativeSelectOption value='' disabled>Choose captain</NativeSelectOption>
                    {players.map((player) => (
                      <NativeSelectOption key={player.id} value={player.id}
                        disabled={sizes.some((_, other) => other !== index && captains[other] === player.id)}>
                        {player.displayName} · {player.riotId} · {player.approvedTier}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </div>
              ))}
              {!sizes.length && <p className='text-sm text-muted-foreground'>Approve at least six players to create a team.</p>}
            </div>
            <div className='mt-5 border-t border-border pt-4'>
              <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                <AlertDialogTrigger render={<Button type='button' disabled={!ready || pending} />}>
                  <Play size={16} /> Create teams and start draft
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Replace teams and start draft?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Existing teams, rosters, draft history, invitations and join requests will be replaced.
                      All {players.length} approved players will enter {sizes.length} new teams.
                      Pending players keep their registrations but remain unassigned.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={pending}>Cancel</AlertDialogCancel>
                    <AlertDialogAction type='submit' form='start-captain-draft' name='confirmRebuild' value='yes' disabled={pending}>
                      {pending ? 'Starting…' : 'Create teams and start'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
            {state.error && <Alert aria-live='polite' className='mt-4' variant='destructive'><AlertDescription>{state.error}</AlertDescription></Alert>}
          </SharedCard>
          <SharedCard className='p-5 desktop:p-6'>
            <Kicker className='text-primary-muted'>DRAFT RULES</Kicker>
            <div className='mt-4 flex flex-col gap-3'>
              <RuleLine title='Picking order' detail='Random captain order. The snake reverses each round, drafting T1 through T4 until everyone is assigned.' />
              <RuleLine title='Starting lineup' detail='Five starters: at most one T1 and two T2 players. All remaining players are substitutes.' />
              <RuleLine title='Team names' detail='Teams start as Team A, Team B and so on. Captains can rename their team after the draft finishes.' />
              <RuleLine title='Turn timer' detail='60 seconds per pick. The organizer can pause, adjust time or restart.' />
            </div>
          </SharedCard>
        </form>
      </div>
    </PageFrame>
  );
}

function RuleLine({ title, detail }: { title: string; detail: string }) {
  return (
    <div className='rounded-xl border border-border bg-secondary px-3.5 py-3'>
      <p className='m-0 text-sm font-semibold'>{title}</p>
      <p className='mt-1 mb-0 text-xs leading-5 text-muted-foreground'>
        {detail}
      </p>
    </div>
  );
}

function DraftRoom({
  props,
  organizer,
}: {
  props: TournamentAppProps;
  organizer: boolean;
}) {
  const { board, refresh } = useDraftRefresh(props.draft);
  const [rebuilding, setRebuilding] = useState(false);

  if (organizer && rebuilding && board) {
    return <DraftSetup players={props.draftSetupPlayers ?? []} previousDraft={board}
      onCancel={() => setRebuilding(false)} onStarted={() => { setRebuilding(false); void refresh(); }} />;
  }

  if (!board) {
    if (organizer) return <DraftSetup players={props.draftSetupPlayers ?? []} />;
    return <EmptyDraftRoom />;
  }

  const activeCaptain =
    !organizer && board.viewer.isCurrentCaptain && board.status === 'active';
  return (
    <PageFrame>
      <div className='mx-auto flex max-w-[1440px] flex-col gap-4'>
        <DraftHeader board={board} organizer={organizer} />
        <div className='flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-3 text-xs text-secondary-foreground'>
          {activeCaptain ? (
            <Crown
              aria-hidden='true'
              className='shrink-0 text-primary'
              size={15}
            />
          ) : (
            <Users
              aria-hidden='true'
              className='shrink-0 text-primary'
              size={15}
            />
          )}
          <span>
            {activeCaptain
              ? `You are picking for ${board.currentCaptainName ?? 'your team'}.`
              : `Current captain: ${board.currentCaptainName ?? 'draft complete'} · next team updates with the live board.`}
          </span>
        </div>
        <AnimatePresence initial={false} mode='wait'>
          {activeCaptain || (organizer && board.status === 'active') ? (
            <motion.div
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              initial={{ opacity: 0, transform: 'translateY(6px)' }}
              key='picker'
              transition={{ duration: 0.15, ease: easeOutExpo }}
            >
              <DraftPickSurface
                board={board}
                onRefresh={refresh}
                organizer={organizer}
              />
            </motion.div>
          ) : (
            <motion.div
              animate={{ opacity: 1, transform: 'translateY(0)' }}
              initial={{ opacity: 0, transform: 'translateY(6px)' }}
              key='board'
              transition={{ duration: 0.15, ease: easeOutExpo }}
            >
              <DraftBoard board={board} organizer={organizer} />
            </motion.div>
          )}
        </AnimatePresence>
        {organizer ? (
          <OrganizerControls board={board} onRefresh={refresh} onRebuild={() => setRebuilding(true)} />
        ) : null}
        {board.status === 'needs_repair' ? (
          <Alert className='border-danger/30 bg-danger-soft text-danger'>
            <AlertDescription className='text-danger'>
              The final T4 pool is exhausted. Incomplete teams are flagged for
              organizer repair before lineup submission.
            </AlertDescription>
          </Alert>
        ) : null}
        {/* <div className='grid gap-4 desktop:grid-cols-[minmax(0,1fr)_minmax(300px,0.38fr)]'>
          <DraftBoard board={board} organizer={organizer} />
          <MobileTurnCard board={board} />
        </div> */}
      </div>
    </PageFrame>
  );
}

function MobileTurnCard({ board }: { board: DraftBoardData }) {
  const timer = useDraftClock(board);
  const currentTeam = board.teams.find(
    (team) => team.id === board.currentTeamId,
  );
  const nextTeam = board.teams.find((team) => team.id === board.nextTeamId);
  return (
    <SharedCard className='p-4 desktop:hidden'>
      <div className='flex items-center justify-between gap-3'>
        <div>
          <Kicker className='text-primary-muted'>CURRENT / NEXT</Kicker>
          <p className='mt-2 mb-0 text-sm font-semibold'>
            {currentTeam?.name ?? 'Complete'}
          </p>
        </div>
        <p className='m-0 font-mono text-sm font-semibold text-primary'>
          {board.status === 'active'
            ? formatSeconds(timer)
            : board.status.toUpperCase()}
        </p>
      </div>
      <div className='mt-4 grid grid-cols-2 gap-2'>
        <div className='rounded-lg border border-primary/40 bg-primary-soft px-3 py-2'>
          <p className='m-0 font-mono text-3xs tracking-[0.14em] text-primary'>
            NOW
          </p>
          <p className='mt-1 mb-0 truncate text-xs font-semibold'>
            {currentTeam?.captainName ?? '—'}
          </p>
        </div>
        <div className='rounded-lg border border-border bg-secondary px-3 py-2'>
          <p className='m-0 font-mono text-3xs tracking-[0.14em] text-muted-foreground'>
            NEXT
          </p>
          <p className='mt-1 mb-0 truncate text-xs font-semibold'>
            {nextTeam?.captainName ?? '—'}
          </p>
        </div>
      </div>
    </SharedCard>
  );
}

export function TournamentDraftRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <DraftRoom props={props} organizer={false} />
    </TournamentAppRouteFrame>
  );
}

export function TournamentAdminDraftRoute(props: TournamentAppProps) {
  return (
    <TournamentAppRouteFrame {...props}>
      <DraftRoom props={props} organizer />
    </TournamentAppRouteFrame>
  );
}
