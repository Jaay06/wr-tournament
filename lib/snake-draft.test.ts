import assert from "node:assert/strict";
import test from "node:test";

import {
  nextDraftCursorAfterPick,
  normalizeDraftCursor,
  type DraftCursor,
  type DraftPoolSnapshot,
  type DraftTeamSnapshot,
} from "./snake-draft";

function teams(count: number): DraftTeamSnapshot[] {
  return Array.from({ length: count }, (_, index) => ({
    teamId: String.fromCharCode(65 + index),
    memberCount: 1,
    tierCounts: { T1: 0, T2: 0, T3: 0, T4: 0 },
  }));
}

function pool(tier: DraftPoolSnapshot["tier"], count: number): DraftPoolSnapshot[] {
  return Array.from({ length: count }, (_, index) => ({
    registrationId: `${tier}-${index}`,
    tier,
    available: true,
  }));
}

function pick(
  cursor: DraftCursor,
  teamRows: DraftTeamSnapshot[],
  poolRows: DraftPoolSnapshot[],
) {
  const team = teamRows[cursor.teamIndex];
  const player = poolRows.find(
    (candidate) => candidate.available && candidate.tier === cursor.tier,
  );
  assert.ok(player);
  player.available = false;
  team.memberCount += 1;
  team.tierCounts[cursor.tier] += 1;
  const transition = nextDraftCursorAfterPick(cursor, teamRows, poolRows);
  assert.equal(transition.completed, false);
  return transition.cursor;
}

test("the fixed tiers follow the four-team snake order", () => {
  const teamRows = teams(4);
  const poolRows = [...pool("T1", 4), ...pool("T2", 8), ...pool("T3", 1)];
  let cursor: DraftCursor = {
    tier: "T1",
    tierRound: 1,
    round: 1,
    teamIndex: 0,
    direction: "forward",
  };
  const order: string[] = [];

  for (let index = 0; index < 12; index += 1) {
    order.push(`${cursor.tier}${cursor.tierRound}:${teamRows[cursor.teamIndex].teamId}`);
    cursor = pick(cursor, teamRows, poolRows);
  }

  assert.deepEqual(order, [
    "T11:A",
    "T11:B",
    "T11:C",
    "T11:D",
    "T21:D",
    "T21:C",
    "T21:B",
    "T21:A",
    "T22:A",
    "T22:B",
    "T22:C",
    "T22:D",
  ]);
});

test("an exhausted tier skips the rest of its current snake round", () => {
  const teamRows = teams(4);
  const poolRows: DraftPoolSnapshot[] = [
    { registrationId: "t1", tier: "T1", available: true },
    { registrationId: "t2", tier: "T2", available: true },
  ];
  const cursor: DraftCursor = {
    tier: "T1",
    tierRound: 1,
    round: 1,
    teamIndex: 0,
    direction: "forward",
  };

  const next = pick(cursor, teamRows, poolRows);

  assert.deepEqual(next, {
    tier: "T2",
    tierRound: 1,
    round: 2,
    teamIndex: 3,
    direction: "reverse",
  });
});

test("a full team is skipped while another team remains eligible", () => {
  const teamRows = teams(3);
  teamRows[1].memberCount = 5;
  const poolRows = pool("T3", 2);
  const cursor: DraftCursor = {
    tier: "T3",
    tierRound: 1,
    round: 4,
    teamIndex: 0,
    direction: "forward",
  };

  const next = pick(cursor, teamRows, poolRows);

  assert.equal(next.teamIndex, 2);
  assert.equal(next.direction, "forward");
});

test("normalization marks the draft complete after T4 is exhausted", () => {
  const teamRows = teams(2);
  const cursor: DraftCursor = {
    tier: "T4",
    tierRound: 3,
    round: 8,
    teamIndex: 0,
    direction: "forward",
  };

  const transition = normalizeDraftCursor(cursor, teamRows, []);

  assert.equal(transition.completed, true);
});
