import assert from "node:assert/strict";
import test from "node:test";
import type { FixtureEntry, FixtureMatch } from "./fixture-types";
import {
  calculateStandings,
  isValidSeriesScore,
  matchWinner,
  validatePlayoffOrder,
} from "./fixture-rules";

function entry(teamId: string, seed = Number(teamId.charCodeAt(0))) {
  return { teamId, name: teamId, seed } satisfies FixtureEntry;
}

function match(
  id: string,
  homeTeamId: string | null,
  awayTeamId: string | null,
  homeScore: number | null,
  awayScore: number | null,
  stage: FixtureMatch["stage"] = "league",
): FixtureMatch {
  return {
    id,
    stage,
    round: 1,
    position: 1,
    homeTeamId,
    awayTeamId,
    homeScore,
    awayScore,
    scheduledAt: null,
  };
}

test("accepts only valid best-of-three series scores", () => {
  for (const [home, away] of [
    [2, 0],
    [2, 1],
    [0, 2],
    [1, 2],
  ]) {
    assert.equal(isValidSeriesScore(home, away), true);
  }

  for (const [home, away] of [
    [0, 0],
    [1, 1],
    [2, 2],
    [3, 0],
    [1.5, 2],
    [-1, 2],
  ]) {
    assert.equal(isValidSeriesScore(home, away), false);
  }
});

test("returns a winner only for a valid completed match with two opponents", () => {
  assert.equal(matchWinner(match("home-win", "A", "B", 2, 1)), "A");
  assert.equal(matchWinner(match("away-win", "A", "B", 0, 2)), "B");
  assert.equal(matchWinner(match("incomplete", "A", "B", null, null)), null);
  assert.equal(matchWinner(match("bad-score", "A", "B", 2, 2)), null);
  assert.equal(matchWinner(match("missing-team", "A", null, 2, 0)), null);
  assert.equal(matchWinner(match("same-team", "A", "A", 2, 0)), null);
  assert.equal(matchWinner(match("empty-team", "", "B", 2, 0)), null);
});

test("ranks series wins before overall game difference", () => {
  const standings = calculateStandings(
    [entry("A"), entry("B"), entry("C"), entry("D")],
    [
      match("a-b", "A", "B", 2, 1),
      match("a-c", "A", "C", 2, 1),
      match("d-a", "D", "A", 2, 0),
      match("b-c", "B", "C", 2, 0),
    ],
  );

  assert.equal(standings[0].teamId, "A");
  assert.equal(standings[0].wins, 2);
  assert.equal(standings[0].gameDifference, 0);
  assert.equal(standings[1].teamId, "D");
  assert.equal(standings[1].wins, 1);
  assert.equal(standings[1].gameDifference, 2);
});

test("uses two-way head-to-head wins before game difference", () => {
  const standings = calculateStandings(
    [entry("A"), entry("B"), entry("C"), entry("D")],
    [
      match("a-b", "A", "B", 2, 0),
      match("c-a", "C", "A", 2, 0),
      match("b-c", "B", "C", 2, 0),
      match("c-d", "C", "D", 2, 0),
    ],
  );

  const tied = standings.filter((standing) => standing.wins === 1);
  assert.deepEqual(tied.map((standing) => standing.teamId), ["A", "B"]);
  assert.equal(tied[0].headToHeadWins, 1);
  assert.equal(tied[1].headToHeadWins, 0);
  assert.equal(tied[0].gameDifference, tied[1].gameDifference);
});

test("keeps a three-way head-to-head cycle in one unresolved tie group", () => {
  const standings = calculateStandings(
    [entry("A"), entry("B"), entry("C")],
    [
      match("a-b", "A", "B", 2, 1),
      match("b-c", "B", "C", 2, 1),
      match("c-a", "C", "A", 2, 1),
    ],
  );

  assert.deepEqual(standings.map((standing) => standing.teamId), ["A", "B", "C"]);
  assert.equal(standings.every((standing) => standing.headToHeadWins === 1), true);
  assert.equal(standings.every((standing) => standing.gameDifference === 0), true);
  assert.deepEqual(
    new Set(standings.map((standing) => standing.tieGroup)),
    new Set(["A|B|C"]),
  );
});

test("ignores incomplete matches and matches outside the league stage", () => {
  const standings = calculateStandings(
    [entry("A"), entry("B")],
    [
      match("incomplete", "A", "B", 2, null),
      match("semifinal", "A", "B", 2, 0, "semifinal"),
      match("final", "A", "B", 0, 2, "final"),
    ],
  );

  assert.deepEqual(
    standings.map(({ teamId, played, wins, losses, points }) => ({
      teamId,
      played,
      wins,
      losses,
      points,
    })),
    [
      { teamId: "A", played: 0, wins: 0, losses: 0, points: 0 },
      { teamId: "B", played: 0, wins: 0, losses: 0, points: 0 },
    ],
  );
});

test("accepts only complete playoff permutations that preserve ranked groups", () => {
  const standings = calculateStandings(
    [entry("A"), entry("B"), entry("C"), entry("D")],
    [
      match("a-b", "A", "B", 2, 1),
      match("b-c", "B", "C", 2, 1),
      match("c-a", "C", "A", 2, 1),
      match("d-a", "D", "A", 2, 0),
      match("d-b", "D", "B", 2, 0),
      match("d-c", "D", "C", 2, 0),
    ],
  );

  assert.equal(
    validatePlayoffOrder(standings, ["D", "A", "B", "C"]),
    true,
  );
  assert.equal(
    validatePlayoffOrder(standings, ["D", "C", "B", "A"]),
    true,
  );
  assert.equal(
    validatePlayoffOrder(standings, ["A", "D", "B", "C"]),
    false,
  );
  assert.equal(
    validatePlayoffOrder(standings, ["D", "A", "B"]),
    false,
  );
  assert.equal(
    validatePlayoffOrder(standings, ["D", "A", "A", "C"]),
    false,
  );
});
