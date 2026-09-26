import { generateRoundRobin } from './fixture-pairings';
import { calculateStandings } from './fixture-rules';
import type { FixtureBoard, FixtureEntry, FixtureMatch, FixturePhase, FixtureTeamOption } from './fixture-types';

// Synthetic teams for the development-only UI preview; never loaded by room routes.
export const fixturePreviewTeams: FixtureTeamOption[] = ['A', 'B', 'C', 'D', 'E'].map((letter, index) => ({
  id: `00000000-0000-4000-8000-${String(index + 1).padStart(12, '0')}`,
  name: `Team ${letter}`,
  status: 'draft',
  memberCount: index === 4 ? 6 : 7,
}));

export function getFixturePreview(phase: FixturePhase = 'league'): FixtureBoard {
  const entries: FixtureEntry[] = fixturePreviewTeams.map((team, index) => ({ teamId: team.id, name: team.name, seed: index + 1 }));
  const leagueFinished = phase === 'playoffs' || phase === 'complete';
  const matches: FixtureMatch[] = generateRoundRobin(entries.map((entry) => entry.teamId)).map((pair, index) => {
    const played = leagueFinished || (phase === 'league' && pair.round < 3);
    const homeWins = pair.homeTeamId < pair.awayTeamId;
    return {
      ...pair,
      id: `league-${index}`,
      stage: 'league',
      position: index % 2 + 1,
      homeScore: played ? (homeWins ? 2 : 1) : null,
      awayScore: played ? (homeWins ? 1 : 2) : null,
      scheduledAt: `2026-10-${String(10 + pair.round).padStart(2, '0')}T${index % 2 === 0 ? '18' : '20'}:00:00.000Z`,
    };
  });
  const standings = calculateStandings(entries, matches);
  const order = standings.map((entry) => entry.teamId);
  const complete = phase === 'complete';
  matches.push(
    { id: 'semi-1', stage: 'semifinal', round: 1, position: 1, homeTeamId: leagueFinished ? order[0] : null, awayTeamId: leagueFinished ? order[3] : null, homeScore: complete ? 2 : null, awayScore: complete ? 0 : null, scheduledAt: null },
    { id: 'semi-2', stage: 'semifinal', round: 1, position: 2, homeTeamId: leagueFinished ? order[1] : null, awayTeamId: leagueFinished ? order[2] : null, homeScore: complete ? 2 : null, awayScore: complete ? 1 : null, scheduledAt: null },
    { id: 'final', stage: 'final', round: 1, position: 1, homeTeamId: complete ? order[0] : null, awayTeamId: complete ? order[1] : null, homeScore: complete ? 2 : null, awayScore: complete ? 1 : null, scheduledAt: null },
  );
  return { version: 1, phase, entries, matches, standings, playoffOrder: leagueFinished ? order : null };
}
