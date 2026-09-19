import assert from "node:assert/strict";
import test from "node:test";
import { draftTeamName, draftTeamSizes } from "./draft-setup";

test("automatic teams include captains and distribute every player", () => {
  assert.deepEqual(draftTeamSizes(5), []);
  assert.deepEqual(draftTeamSizes(6), [6]);
  assert.deepEqual(draftTeamSizes(12), [6, 6]);
  assert.deepEqual(draftTeamSizes(13), [7, 6]);
  assert.deepEqual(draftTeamSizes(16), [8, 8]);
  assert.deepEqual(draftTeamSizes(17), [9, 8]);
  assert.deepEqual(draftTeamSizes(18), [6, 6, 6]);
  for (let count = 6; count <= 300; count++) {
    const sizes = draftTeamSizes(count);
    assert.equal(sizes.reduce((sum, size) => sum + size, 0), count);
    assert.ok(Math.min(...sizes) >= 6);
    assert.ok(Math.max(...sizes) - Math.min(...sizes) <= 1);
  }
});

test("automatic team names continue beyond Z", () => {
  assert.equal(draftTeamName(0), "Team A");
  assert.equal(draftTeamName(25), "Team Z");
  assert.equal(draftTeamName(26), "Team AA");
});
