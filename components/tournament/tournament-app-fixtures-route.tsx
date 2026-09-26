'use client';

import { useActionState, useId, useState, type ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, CalendarDays, Check, RefreshCw, Swords, Trophy } from 'lucide-react';
import {
  discardFixtureSchedule, prepareFixtureSchedule, publishFixtureSchedule,
  saveFixtureResult, saveFixtureSchedule, seedFixtureFinals,
} from '@/app/fixtures/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect, NativeSelectOption } from '@/components/ui/native-select';
import { matchWinner } from '@/lib/fixture-rules';
import type { FixtureActionState, FixtureBoard, FixtureMatch, FixtureTeamOption } from '@/lib/fixture-types';
import { cn } from '@/lib/utils';
import { PageFrame, Card, type TournamentAppProps } from './tournament-app-shared';
import { TournamentAppRouteFrame } from './tournament-app-route-frame';

type FixtureAction = (state: FixtureActionState, data: FormData) => Promise<FixtureActionState>;

function ActionForm({ action, children, preview, className }: {
  action: FixtureAction; children: ReactNode; preview: boolean; className?: string;
}) {
  const [state, submit, pending] = useActionState(action, {});
  return <form action={submit} className={className} onSubmit={event => { if (preview) event.preventDefault(); }}>
    <fieldset disabled={pending || preview} className='min-w-0 space-y-3'>{children}</fieldset>
    <div aria-live='polite' aria-atomic='true' className='mt-2 text-sm'>
      {pending ? <p className='text-muted-foreground'>Saving...</p> : state.error ? <p role='alert' className='text-destructive'>{state.error}</p> : state.success ? <p className='text-primary'>{state.success}</p> : null}
    </div>
  </form>;
}

function Version({ board, match }: { board: FixtureBoard; match?: FixtureMatch }) {
  return <><input type='hidden' name='version' value={board.version} />{match ? <input type='hidden' name='matchId' value={match.id} /> : null}</>;
}

function Setup({ teams, preview }: { teams: FixtureTeamOption[]; preview: boolean }) {
  const [selected, setSelected] = useState(teams.map(team => team.id));
  return <Card className='max-w-3xl p-5 sm:p-7'>
    <h2 className='text-xl font-semibold'>Choose the teams</h2>
    <p className='mt-2 max-w-xl text-sm leading-6 text-muted-foreground'>Select at least four teams. Draft teams can take part when you include them. Review the pairings before publishing.</p>
    <ActionForm action={prepareFixtureSchedule} preview={preview} className='mt-6'>
      <div className='divide-y divide-border'>
        {teams.map(team => <label key={team.id} className='flex min-h-16 cursor-pointer items-center gap-4 py-3'>
          <input className='size-5 accent-primary' type='checkbox' name='teamId' value={team.id} checked={selected.includes(team.id)} onChange={event => setSelected(current => event.target.checked ? [...current, team.id] : current.filter(id => id !== team.id))} />
          <span className='flex-1 font-semibold'>{team.name}</span>
          <span className='text-right text-sm text-muted-foreground'>{team.memberCount} {team.memberCount === 1 ? 'player' : 'players'}<span className='ml-3 capitalize'> {team.status}</span></span>
        </label>)}
      </div>
      {teams.length === 0 ? <p className='text-muted-foreground'>Create teams in the draft room before preparing fixtures.</p> : null}
      <div className='flex flex-wrap items-center justify-between gap-4 border-t border-border pt-5'>
        <p className='text-sm text-muted-foreground'>{selected.length} selected · {selected.length * (selected.length - 1) / 2} league matches</p>
        <Button type='submit' className='min-h-11 px-5' disabled={selected.length < 4}>Prepare fixtures <ArrowRight /></Button>
      </div>
    </ActionForm>
  </Card>;
}

function DraftControls({ board, preview }: { board: FixtureBoard; preview: boolean }) {
  return <Card className='mb-6 border-primary/30 p-5'>
    <h2 className='font-semibold'>Review before publishing</h2>
    <p className='mt-1 text-sm leading-6 text-muted-foreground'>Only you can see this draft. Publishing fixes the team list and opens the schedule to participants.</p>
    <div className='mt-4 flex flex-wrap items-start gap-4'>
      <ActionForm action={publishFixtureSchedule} preview={preview}><Version board={board} /><Button type='submit' className='min-h-11 px-5'>Publish fixtures</Button></ActionForm>
      <details className='rounded-lg border border-border px-4 py-3'>
        <summary className='cursor-pointer text-sm font-medium'>Discard draft</summary>
        <p className='mt-3 max-w-sm text-sm text-muted-foreground'>This removes the pairings and match times. You can select teams and prepare a new draft.</p>
        <ActionForm action={discardFixtureSchedule} preview={preview} className='mt-3'><Version board={board} /><Button type='submit' variant='destructive' className='min-h-11'>Confirm discard</Button></ActionForm>
      </details>
    </div>
  </Card>;
}

function Standings({ board }: { board: FixtureBoard }) {
  const rows = board.playoffOrder ? board.playoffOrder.flatMap(id => board.standings.filter(row => row.teamId === id)) : board.standings;
  return <Card className='min-w-0 overflow-hidden'>
    <div className='flex items-center justify-between gap-3 p-5 pb-3'><h2 className='text-xl font-semibold'>League table</h2><span className='text-xs text-muted-foreground'>Top 4 advance</span></div>
    <div className='overflow-x-auto' tabIndex={0} role='region' aria-label='League standings'>
      <table className='w-full min-w-[320px] text-sm'>
        <caption className='sr-only'>League standings. One point per series win. Ties use head-to-head wins, then game difference.</caption>
        <thead className='border-b border-border text-xs text-muted-foreground'><tr>
          <th scope='col' className='py-3 pl-5 text-left'>Team</th>
          {['P', 'W', 'L', 'Games', '+/-', 'Pts'].map(label => <th scope='col' key={label} className={cn('px-1.5 py-3 text-right last:pr-5 sm:px-2', label === 'Games' && 'hidden sm:table-cell')}><abbr className='no-underline' title={{ P: 'Series played', W: 'Series won', L: 'Series lost', Games: 'Games won and lost', '+/-': 'Game difference', Pts: 'Points' }[label]}>{label}</abbr></th>)}
        </tr></thead>
        <tbody>{rows.map((row, index) => <tr key={row.teamId} className={cn('border-b border-border/60 last:border-0', index === 3 && 'border-b-2 border-b-primary/35')}>
          <th scope='row' className='py-4 pl-5 text-left font-medium'><div className='flex items-center gap-3'><span className={cn('w-4 font-mono text-xs', index < 4 ? 'text-primary' : 'text-muted-foreground')}>{index + 1}</span><span>{row.name}{row.tieGroup && !board.playoffOrder ? <span className='mt-0.5 block text-[11px] font-normal text-muted-foreground'>Tied</span> : null}</span></div></th>
          {[row.played, row.wins, row.losses, `${row.gamesWon}:${row.gamesLost}`, row.gameDifference > 0 ? `+${row.gameDifference}` : row.gameDifference, row.points].map((value, cell) => <td key={cell} className={cn('px-1.5 py-4 text-right font-mono text-xs last:pr-5 sm:px-2', cell === 3 && 'hidden sm:table-cell', cell === 5 ? 'font-bold text-primary' : 'text-secondary-foreground')}>{value}</td>)}
        </tr>)}</tbody>
      </table>
    </div>
    <p className='border-t border-border px-5 py-4 text-xs leading-5 text-muted-foreground'>1 point per series win. Ties: head-to-head wins, then game difference. The organizer resolves any remaining ties before seeding.</p>
  </Card>;
}

function MatchEditor({ board, match, preview }: { board: FixtureBoard; match: FixtureMatch; preview: boolean }) {
  const id = useId();
  const canScore = Boolean(match.homeTeamId && match.awayTeamId) && (
    (match.stage === 'league' && board.phase === 'league') ||
    (match.stage === 'semifinal' && board.phase === 'playoffs') ||
    (match.stage === 'final' && (board.phase === 'playoffs' || board.phase === 'complete'))
  );
  const teamName = (teamId: string | null) => board.entries.find(team => team.teamId === teamId)?.name ?? 'TBD';
  return <details className='border-t border-border px-4 py-3'>
    <summary className='min-h-6 cursor-pointer text-sm font-medium text-secondary-foreground'>Manage match</summary>
    {canScore ? <ActionForm action={saveFixtureResult} preview={preview} className='mt-4'>
      <Version board={board} match={match} />
      <div className='grid grid-cols-2 gap-3' key={`score-${board.version}`}>
        {(['home', 'away'] as const).map(side => <div key={side}>
          <label htmlFor={`${id}-${side}`} className='mb-2 block text-xs text-muted-foreground'>{teamName(side === 'home' ? match.homeTeamId : match.awayTeamId)} score</label>
          <NativeSelect id={`${id}-${side}`} name={`${side}Score`} defaultValue={String((side === 'home' ? match.homeScore : match.awayScore) ?? '')} required className='min-h-11'>
            <NativeSelectOption value='' disabled>Select</NativeSelectOption>{[0, 1, 2].map(score => <NativeSelectOption key={score} value={score}>{score}</NativeSelectOption>)}
          </NativeSelect>
        </div>)}
      </div>
      <p className='text-xs text-muted-foreground'>Completed BO3 only: 2-0 or 2-1 to the winner.</p>
      <Button type='submit' className='min-h-11'>Save result</Button>
    </ActionForm> : <p className='mt-3 text-xs leading-5 text-muted-foreground'>{board.phase === 'draft' ? 'Publish fixtures before recording results.' : !match.homeTeamId || !match.awayTeamId ? 'Results open when both teams are known.' : 'Results for this stage are locked.'}</p>}
    <ActionForm action={saveFixtureSchedule} preview={preview} className='mt-4 border-t border-border pt-4'>
      <Version board={board} match={match} />
      <label className='block text-xs text-muted-foreground' htmlFor={`${id}-time`}>Match date and time (UTC)</label>
      <Input key={`time-${board.version}`} id={`${id}-time`} name='scheduledAt' type='datetime-local' defaultValue={match.scheduledAt?.slice(0, 16) ?? ''} className='min-h-11 w-full min-w-0' />
      <p className='text-xs text-muted-foreground'>Leave empty to mark the time as unconfirmed.</p>
      <Button type='submit' variant='outline' className='min-h-11'>Save time</Button>
    </ActionForm>
  </details>;
}

function MatchCard({ board, match, organizer, preview, title }: { board: FixtureBoard; match: FixtureMatch; organizer: boolean; preview: boolean; title?: string }) {
  const winner = matchWinner(match);
  const placeholder = (side: 'home' | 'away') => match.stage === 'final' ? `Semifinal ${side === 'home' ? 1 : 2} winner` : `${match.position === 1 ? (side === 'home' ? '1st' : '4th') : (side === 'home' ? '2nd' : '3rd')} in league`;
  return <article className={cn('min-w-0 overflow-hidden rounded-card border bg-card', match.stage === 'final' ? 'border-primary/35' : 'border-border')}>
    <div className='flex items-center justify-between gap-3 border-b border-border px-4 py-3 text-xs text-muted-foreground'><span>{title ?? `Match ${match.position}`}</span><span className={cn('font-mono text-[10px]', winner && 'text-primary')}>{winner ? 'COMPLETED' : 'BO3'}</span></div>
    <div className='space-y-3 p-4'>
      {(['home', 'away'] as const).map(side => {
        const teamId = side === 'home' ? match.homeTeamId : match.awayTeamId;
        const name = board.entries.find(team => team.teamId === teamId)?.name;
        const score = side === 'home' ? match.homeScore : match.awayScore;
        return <div key={side} className={cn('flex min-h-8 items-center gap-3', winner === teamId && teamId ? 'text-primary' : !teamId ? 'text-muted-foreground' : 'text-foreground')}>
          <span className='min-w-0 flex-1 break-words font-semibold'>{name ?? placeholder(side)}</span>
          {winner === teamId && teamId ? <Check className='size-4' aria-label='Winner' /> : null}
          <span className='font-mono text-xl font-semibold tabular-nums'>{score ?? <span className='text-muted-foreground'>-</span>}</span>
        </div>;
      })}
    </div>
    <div className='flex items-center gap-2 px-4 pb-4 text-xs text-muted-foreground'><CalendarDays className='size-3.5 shrink-0' aria-hidden='true' />{match.scheduledAt ? <time dateTime={match.scheduledAt}>{new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'UTC' }).format(new Date(match.scheduledAt))} UTC</time> : 'Time to be confirmed'}</div>
    {organizer ? <MatchEditor board={board} match={match} preview={preview} /> : null}
  </article>;
}

function LeagueRounds({ board, organizer, preview }: { board: FixtureBoard; organizer: boolean; preview: boolean }) {
  const league = board.matches.filter(match => match.stage === 'league');
  const rounds = [...new Set(league.map(match => match.round))];
  const [selectedRound, setSelectedRound] = useState(() => league.find(match => !matchWinner(match))?.round ?? 1);
  const active = rounds.includes(selectedRound) ? selectedRound : rounds[0];
  const matches = league.filter(match => match.round === active);
  const playing = new Set(matches.flatMap(match => [match.homeTeamId, match.awayTeamId]));
  const resting = board.entries.filter(team => !playing.has(team.teamId));
  return <section className='min-w-0' aria-labelledby='rounds-heading'>
    <div className='mb-4 flex items-center justify-between gap-3'><h2 id='rounds-heading' className='text-xl font-semibold'>League fixtures</h2><span className='text-xs text-muted-foreground'>{league.filter(match => matchWinner(match)).length} / {league.length} played</span></div>
    <div className='mb-4 flex gap-2 overflow-x-auto pb-1' role='group' aria-label='Choose a league round'>
      {rounds.map(round => <Button key={round} type='button' variant={round === active ? 'default' : 'outline'} className='min-h-11 shrink-0 px-4' aria-pressed={round === active} onClick={() => setSelectedRound(round)}>Round {round}</Button>)}
    </div>
    <div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>{matches.map(match => <MatchCard key={match.id} board={board} match={match} organizer={organizer} preview={preview} />)}</div>
    {resting.length ? <p className='mt-4 text-sm text-muted-foreground'>{resting.map(team => team.name).join(', ')} sits out this round. No points awarded.</p> : null}
  </section>;
}

function PlayoffSeeding({ board, preview }: { board: FixtureBoard; preview: boolean }) {
  const complete = board.matches.filter(match => match.stage === 'league').every(match => matchWinner(match));
  const [order, setOrder] = useState(board.standings.map(row => row.teamId));
  if (!complete) return <p className='mb-5 text-sm text-muted-foreground'>Complete every league match to seed the semifinals.</p>;
  return <Card className='mb-5 p-5'>
    <h3 className='font-semibold'>Confirm playoff seeding</h3>
    <p className='mt-2 text-sm leading-6 text-muted-foreground'>1st plays 4th. 2nd plays 3rd. Resolve any remaining ties here. Confirming locks league results.</p>
    <ActionForm action={seedFixtureFinals} preview={preview} className='mt-4'>
      <Version board={board} />
      <div className='grid gap-3 sm:grid-cols-2'>
        {board.standings.map((row, index) => {
          const peers = row.tieGroup ? board.standings.filter(peer => peer.tieGroup === row.tieGroup) : [row];
          return <label key={row.teamId} className='block text-xs text-muted-foreground'>Seed {index + 1}
            <NativeSelect className='mt-2 min-h-11' name='orderedTeamId' value={order[index]} onChange={event => {
              const next = [...order]; const previous = next[index]; const other = next.indexOf(event.target.value);
              next[index] = event.target.value; if (other >= 0) next[other] = previous; setOrder(next);
            }}>{peers.map(peer => <NativeSelectOption key={peer.teamId} value={peer.teamId}>{peer.name}</NativeSelectOption>)}</NativeSelect>
          </label>;
        })}
      </div>
      <Button type='submit' className='min-h-11 px-5'>Seed semifinals <ArrowRight /></Button>
    </ActionForm>
  </Card>;
}

function FixturesContent(props: TournamentAppProps) {
  const { fixtures: board, fixtureTeams = [], fixturePreview = false } = props;
  const organizer = props.view === 'admin-fixtures';
  const router = useRouter();
  const final = board?.matches.find(match => match.stage === 'final');
  const championId = final ? matchWinner(final) : null;
  const champion = board?.entries.find(team => team.teamId === championId);
  return <TournamentAppRouteFrame {...props}>
    <PageFrame className='mx-auto max-w-[1600px]'>
      <div className='mb-7 flex flex-wrap items-start justify-between gap-4'>
        <div><p className='mb-3 font-mono text-[10px] uppercase tracking-[0.16em] text-primary'>Tournament / Fixtures</p><h1 className='font-display text-3xl font-bold tracking-tight sm:text-4xl'>The road to the final.</h1><p className='mt-3 text-sm leading-6 text-muted-foreground'>League standings and matchups through to the final. Every match is best-of-three.</p></div>
        <Button variant='outline' className='min-h-11' onClick={() => router.refresh()}><RefreshCw className='size-4' />Refresh</Button>
      </div>
      {fixturePreview ? <p className='mb-5 rounded-lg border border-border bg-secondary px-4 py-3 text-sm text-muted-foreground'>Sample data for design review. Organizer actions are disabled.</p> : null}
      {board ? <>
        {board.phase === 'draft' && organizer ? <DraftControls board={board} preview={fixturePreview} /> : null}
        <div className='mb-7 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-border py-4 text-sm'>
          <span className='font-semibold text-primary'>{({ draft: 'Unpublished draft', league: 'League stage', playoffs: 'Playoffs', complete: 'Tournament complete' })[board.phase]}</span>
          <span className='text-muted-foreground'>{board.entries.length} teams</span><span className='text-muted-foreground'>{board.matches.length} matches</span>
          <a href='#playoffs' className='ml-auto inline-flex min-h-8 items-center gap-2 font-medium hover:text-primary'>Playoffs <ArrowRight className='size-4' /></a>
        </div>
        {champion ? <div className='mb-7 flex items-center gap-5 rounded-card border border-primary/40 bg-primary/5 p-6'><Trophy className='size-10 shrink-0 text-primary' aria-hidden='true' /><div><p className='text-sm text-muted-foreground'>Tournament champion</p><h2 className='mt-1 text-3xl font-bold text-primary'>{champion.name}</h2></div></div> : null}
        <div className='grid items-start gap-7 min-[1200px]:grid-cols-[minmax(400px,0.85fr)_minmax(0,1.15fr)]'>
          <Standings board={board} /><LeagueRounds key={board.entries.map(entry => entry.teamId).join(',')} board={board} organizer={organizer} preview={fixturePreview} />
        </div>
        <section id='playoffs' aria-labelledby='playoffs-heading' className='mt-10 scroll-mt-24 border-t border-border pt-7'>
          <div className='mb-5'><h2 id='playoffs-heading' className='text-2xl font-semibold'>Playoffs</h2><p className='mt-2 text-sm text-muted-foreground'>The top four advance. Semifinal winners meet in the final.</p></div>
          {organizer && board.phase === 'league' ? <PlayoffSeeding key={board.version} board={board} preview={fixturePreview} /> : null}
          <div className='grid items-center gap-6 md:grid-cols-2'>
            <div className='grid gap-4'>{board.matches.filter(match => match.stage === 'semifinal').map(match => <MatchCard key={match.id} title={`Semifinal ${match.position}`} board={board} match={match} organizer={organizer} preview={fixturePreview} />)}</div>
            {final ? <div><div className='mb-3 flex items-center gap-2 text-sm font-medium text-primary'><Trophy className='size-4' />Grand final</div><MatchCard title='Final' board={board} match={final} organizer={organizer} preview={fixturePreview} /></div> : null}
          </div>
        </section>
      </> : organizer ? <Setup teams={fixtureTeams} preview={fixturePreview} /> : <Card className='max-w-2xl p-7 sm:p-10'><Swords className='mb-5 size-8 text-primary' aria-hidden='true' /><h2 className='text-2xl font-semibold'>The schedule is on its way.</h2><p className='mt-3 max-w-lg text-sm leading-6 text-muted-foreground'>The organizer is preparing the matchups. Once published, your league fixtures and the path to the final will appear here.</p></Card>}
    </PageFrame>
  </TournamentAppRouteFrame>;
}

export function TournamentFixturesRoute(props: TournamentAppProps) { return <FixturesContent {...props} />; }
export function TournamentAdminFixturesRoute(props: TournamentAppProps) { return <FixturesContent {...props} />; }
