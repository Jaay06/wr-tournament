import type {
  FixtureEntry,
  FixtureMatch,
  FixtureStanding,
} from "./fixture-types";

const EMPTY_TIE_GROUP = "";

/** A best-of-three series can only end in one of these four results. */
export function isValidSeriesScore(home: number, away: number): boolean {
  return (
    Number.isInteger(home) &&
    Number.isInteger(away) &&
    ((home === 2 && (away === 0 || away === 1)) ||
      (away === 2 && (home === 0 || home === 1)))
  );
}

/**
 * Return the winner of a completed valid series. Invalid or incomplete
 * matches do not have a winner and are represented by null.
 */
export function matchWinner(match: FixtureMatch): string | null {
  const { homeTeamId, awayTeamId, homeScore, awayScore } = match;

  if (
    typeof homeTeamId !== "string" ||
    typeof awayTeamId !== "string" ||
    homeTeamId.trim().length === 0 ||
    awayTeamId.trim().length === 0 ||
    homeTeamId === awayTeamId ||
    homeScore === null ||
    awayScore === null ||
    !isValidSeriesScore(homeScore, awayScore)
  ) {
    return null;
  }

  return homeScore > awayScore ? homeTeamId : awayTeamId;
}

function compareTeamIds(left: string, right: string): number {
  if (left < right) return -1;
  if (left > right) return 1;
  return 0;
}

function tieGroupKey(teamIds: readonly string[]): string {
  return [...teamIds].sort(compareTeamIds).join("|");
}

function compareDisplayOrder(left: FixtureStanding, right: FixtureStanding): number {
  if (left.seed !== right.seed) return left.seed - right.seed;
  return compareTeamIds(left.teamId, right.teamId);
}

/**
 * Calculate league standings from completed league series.
 *
 * Semifinal and final results are deliberately excluded. Seed is used only
 * to make an unresolved tied group readable; playoff validation still treats
 * every member of that group as interchangeable.
 */
export function calculateStandings(
  entries: readonly FixtureEntry[],
  matches: readonly FixtureMatch[],
): FixtureStanding[] {
  const standings = entries.map<FixtureStanding>((entry) => ({
    ...entry,
    played: 0,
    wins: 0,
    losses: 0,
    gamesWon: 0,
    gamesLost: 0,
    gameDifference: 0,
    headToHeadWins: 0,
    points: 0,
    tieGroup: EMPTY_TIE_GROUP,
  }));
  const standingsByTeamId = new Map(
    standings.map((standing) => [standing.teamId, standing]),
  );

  const completedLeagueMatches: Array<{
    homeTeamId: string;
    awayTeamId: string;
    winnerTeamId: string;
    homeScore: number;
    awayScore: number;
  }> = [];

  for (const match of matches) {
    if (match.stage !== "league") continue;

    const winnerTeamId = matchWinner(match);
    if (!winnerTeamId) continue;

    const { homeTeamId, awayTeamId, homeScore, awayScore } = match;
    if (
      typeof homeTeamId !== "string" ||
      typeof awayTeamId !== "string" ||
      !standingsByTeamId.has(homeTeamId) ||
      !standingsByTeamId.has(awayTeamId) ||
      homeScore === null ||
      awayScore === null
    ) {
      continue;
    }

    const homeStanding = standingsByTeamId.get(homeTeamId);
    const awayStanding = standingsByTeamId.get(awayTeamId);
    if (!homeStanding || !awayStanding) continue;

    const winner = standingsByTeamId.get(winnerTeamId);
    const loserTeamId = winnerTeamId === homeTeamId ? awayTeamId : homeTeamId;
    const loser = standingsByTeamId.get(loserTeamId);
    if (!winner || !loser) continue;

    homeStanding.played += 1;
    awayStanding.played += 1;
    homeStanding.gamesWon += homeScore;
    homeStanding.gamesLost += awayScore;
    awayStanding.gamesWon += awayScore;
    awayStanding.gamesLost += homeScore;
    winner.wins += 1;
    winner.points += 1;
    loser.losses += 1;

    completedLeagueMatches.push({
      homeTeamId,
      awayTeamId,
      winnerTeamId,
      homeScore,
      awayScore,
    });
  }

  for (const standing of standings) {
    standing.gameDifference = standing.gamesWon - standing.gamesLost;
  }

  // Head-to-head wins apply only inside a group tied on overall series wins.
  for (const result of completedLeagueMatches) {
    const homeStanding = standingsByTeamId.get(result.homeTeamId);
    const awayStanding = standingsByTeamId.get(result.awayTeamId);
    const winner = standingsByTeamId.get(result.winnerTeamId);
    if (
      homeStanding &&
      awayStanding &&
      winner &&
      homeStanding.wins === awayStanding.wins
    ) {
      winner.headToHeadWins += 1;
    }
  }

  const groupsByWins = new Map<number, FixtureStanding[]>();
  for (const standing of standings) {
    const group = groupsByWins.get(standing.wins) ?? [];
    group.push(standing);
    groupsByWins.set(standing.wins, group);
  }

  const orderedStandings: FixtureStanding[] = [];
  const orderedWinGroups = [...groupsByWins.entries()].sort(
    ([leftWins], [rightWins]) => rightWins - leftWins,
  );

  for (const [, winGroup] of orderedWinGroups) {
    const orderedGroup = [...winGroup].sort(
      (left, right) =>
        right.headToHeadWins - left.headToHeadWins ||
        right.gameDifference - left.gameDifference ||
        compareDisplayOrder(left, right),
    );

    let groupStart = 0;
    while (groupStart < orderedGroup.length) {
      let groupEnd = groupStart + 1;
      const first = orderedGroup[groupStart];
      while (
        groupEnd < orderedGroup.length &&
        orderedGroup[groupEnd].headToHeadWins === first.headToHeadWins &&
        orderedGroup[groupEnd].gameDifference === first.gameDifference
      ) {
        groupEnd += 1;
      }

      const equalGroup = orderedGroup.slice(groupStart, groupEnd);
      if (equalGroup.length > 1) {
        const key = tieGroupKey(equalGroup.map((standing) => standing.teamId));
        for (const standing of equalGroup) standing.tieGroup = key;
      }

      orderedStandings.push(...equalGroup);
      groupStart = groupEnd;
    }
  }

  return orderedStandings;
}

/**
 * Verify an organizer's complete playoff order against the ranked standings.
 * Members of one unresolved tie group may be ordered either way.
 */
export function validatePlayoffOrder(
  standings: readonly FixtureStanding[],
  orderedIds: readonly string[],
): boolean {
  if (orderedIds.length !== standings.length) return false;

  const standingsByTeamId = new Map<string, FixtureStanding>();
  for (const standing of standings) {
    if (standingsByTeamId.has(standing.teamId)) return false;
    standingsByTeamId.set(standing.teamId, standing);
  }

  const seen = new Set<string>();
  for (const teamId of orderedIds) {
    if (seen.has(teamId) || !standingsByTeamId.has(teamId)) return false;
    seen.add(teamId);
  }

  for (let index = 0; index < standings.length; index += 1) {
    const expected = standings[index];
    const actual = standingsByTeamId.get(orderedIds[index]);
    if (!actual) return false;

    if (expected.tieGroup === EMPTY_TIE_GROUP) {
      if (actual.teamId !== expected.teamId) return false;
    } else if (actual.tieGroup !== expected.tieGroup) {
      return false;
    }
  }

  return true;
}
