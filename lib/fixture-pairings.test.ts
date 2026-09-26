import assert from "node:assert/strict";
import test from "node:test";
import {
  generateRoundRobin,
  type RoundRobinFixture,
} from "./fixture-pairings";

function pairKey(homeTeamId: string, awayTeamId: string) {
  return [homeTeamId, awayTeamId].sort().join("\u0000");
}

function assertUniquePairings(
  fixtures: readonly RoundRobinFixture[],
  teamIds: readonly string[],
) {
  const pairings = new Set<string>();
  const teamsPerRound = new Map<number, Set<string>>();

  for (const fixture of fixtures) {
    assert.notEqual(fixture.homeTeamId, fixture.awayTeamId);

    const key = pairKey(fixture.homeTeamId, fixture.awayTeamId);
    assert.equal(pairings.has(key), false, `duplicate pairing: ${key}`);
    pairings.add(key);

    const roundTeams = teamsPerRound.get(fixture.round) ?? new Set<string>();
    assert.equal(
      roundTeams.has(fixture.homeTeamId),
      false,
      `team appears twice in round ${fixture.round}`,
    );
    assert.equal(
      roundTeams.has(fixture.awayTeamId),
      false,
      `team appears twice in round ${fixture.round}`,
    );
    roundTeams.add(fixture.homeTeamId);
    roundTeams.add(fixture.awayTeamId);
    teamsPerRound.set(fixture.round, roundTeams);
  }

  assert.equal(pairings.size, (teamIds.length * (teamIds.length - 1)) / 2);
}

test("generates a five-team round robin with one bye per team", () => {
  const teamIds = ["A", "B", "C", "D", "E"];
  const fixtures = generateRoundRobin(teamIds);

  assert.equal(fixtures.length, 10);
  assert.deepEqual(
    [...new Set(fixtures.map((fixture) => fixture.round))],
    [1, 2, 3, 4, 5],
  );
  assertUniquePairings(fixtures, teamIds);

  const byeCounts = new Map(teamIds.map((teamId) => [teamId, 0]));
  for (const round of [1, 2, 3, 4, 5]) {
    const participatingTeams = new Set(
      fixtures
        .filter((fixture) => fixture.round === round)
        .flatMap((fixture) => [fixture.homeTeamId, fixture.awayTeamId]),
    );
    assert.equal(participatingTeams.size, 4);
    const byeTeam = teamIds.find((teamId) => !participatingTeams.has(teamId));
    assert.ok(byeTeam);
    byeCounts.set(byeTeam, (byeCounts.get(byeTeam) ?? 0) + 1);
  }

  assert.deepEqual([...byeCounts.values()], [1, 1, 1, 1, 1]);
});

test("generates every pairing for four teams across three rounds", () => {
  const teamIds = ["A", "B", "C", "D"] as const;
  const fixtures = generateRoundRobin(teamIds);

  assert.equal(fixtures.length, 6);
  assert.deepEqual(
    [...new Set(fixtures.map((fixture) => fixture.round))],
    [1, 2, 3],
  );
  assertUniquePairings(fixtures, teamIds);
  assert.deepEqual(teamIds, ["A", "B", "C", "D"]);
});

test("generates the one match for two teams", () => {
  assert.deepEqual(generateRoundRobin(["A", "B"]), [
    { round: 1, homeTeamId: "A", awayTeamId: "B" },
  ]);
});

test("rejects too few, duplicate, and empty team identifiers", () => {
  assert.throws(
    () => generateRoundRobin([]),
    /at least two teams/,
  );
  assert.throws(
    () => generateRoundRobin(["A"]),
    /at least two teams/,
  );
  assert.throws(
    () => generateRoundRobin(["A", "A"]),
    /must be unique/,
  );
  assert.throws(
    () => generateRoundRobin(["A", ""]),
    /non-empty strings/,
  );
  assert.throws(
    () => generateRoundRobin(["A", "   "]),
    /non-empty strings/,
  );
});
