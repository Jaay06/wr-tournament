import assert from "node:assert/strict";
import test from "node:test";
import { draftTeamSizes } from "./draft-setup";

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
    targetMemberCount: 6,
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

test("tier pools follow the four-team snake order", () => {
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
  teamRows[1].memberCount = 6;
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

test("balanced drafts allocate everyone, including extra high-tier substitutes", () => {
  for (const playerCount of [6, 11, 12, 13, 16, 17, 18, 29, 30, 61]) {
    for (const allHighTier of [false, true]) {
      const sizes = draftTeamSizes(playerCount);
      const teamRows = teams(sizes.length).map((team, index) => ({
        ...team, targetMemberCount: sizes[index],
      }));
      const poolRows = Array.from({ length: playerCount - sizes.length }, (_, index) => ({
        registrationId: `player-${index}`,
        tier: allHighTier ? "T1" as const : (["T1", "T2", "T3", "T4"] as const)[index % 4],
        available: true,
      }));
      let transition = normalizeDraftCursor({ tier: "T1", tierRound: 1, round: 1, teamIndex: 0, direction: "forward" }, teamRows, poolRows);
      let picks = 0;
      while (!transition.completed) {
        assert.ok(picks++ < playerCount, "draft must terminate");
        const { cursor } = transition;
        const team = teamRows[cursor.teamIndex];
        const player = poolRows.find((player) => player.available && player.tier === cursor.tier);
        assert.ok(player);
        player.available = false;
        team.memberCount++;
        team.tierCounts[player.tier]++;
        transition = nextDraftCursorAfterPick(cursor, teamRows, poolRows);
      }
      assert.equal(poolRows.filter((player) => player.available).length, 0);
      assert.deepEqual(teamRows.map((team) => team.memberCount), sizes);
    }
  }
});
