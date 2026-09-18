// Disposable PostgreSQL integration check; never loads .env or the application DB.
// npm install --prefix /tmp/rift-draft-check --no-audit --no-fund @electric-sql/pglite
// NODE_PATH=/tmp/rift-draft-check/node_modules node scripts/check-draft-data.mjs /tmp/rift-draft-check/node_modules/@electric-sql/pglite
import assert from 'node:assert/strict';
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createRequire, Module } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
require('tsx/cjs');
assert.ok(process.argv[2], 'Pass the path to a temporary @electric-sql/pglite installation.');
const { PGlite } = require(path.resolve(process.argv[2]));
const { drizzle } = require('drizzle-orm/pglite');
const { eq, isNull } = require('drizzle-orm');
const pg = new PGlite();
const db = drizzle({ client: pg });
let session = null;
function replaceModule(id, exports) {
  const resolved = require.resolve(id);
  const stub = new Module(resolved);
  stub.exports = exports;
  stub.loaded = true;
  require.cache[resolved] = stub;
}
replaceModule('../db', { db });
replaceModule('../auth', { auth: async () => session });
replaceModule('next/cache', { revalidatePath() {} });
const schema = require('../db/schema');
const draft = require('../lib/draft-data');
const actions = require('../app/draft/actions');
const { renameTeam } = require('../app/tournament/actions');
const { getDraftPollState } = require('../lib/draft-poll-data');
function form(values) {
  const data = new FormData();
  for (const [name, value] of Object.entries(values)) {
    for (const item of Array.isArray(value) ? value : [value]) data.append(name, String(item));
  }
  return data;
}

try {
  const migrations = path.resolve('drizzle');
  for (const directory of (await readdir(migrations)).sort()) {
    if (/^\d/.test(directory)) await pg.exec(await readFile(path.join(migrations, directory, 'migration.sql'), 'utf8'));
  }
  const players = [];
  for (let index = 0; index < 19; index++) {
    const [user] = await db.insert(schema.users).values({ displayName: `Player ${index}`, email: `player${index}@test.invalid`, role: index === 0 ? 'organizer' : 'user', deletedAt: index === 18 ? new Date() : null }).returning();
    const [participant] = await db.insert(schema.tournamentParticipants).values({ userId: user.id }).returning();
    const [registration] = await db.insert(schema.playerRegistrations).values({ participantId: participant.id, riotName: `Player ${index}`, riotTag: 'TEST', currentRank: 'Master', selfAssessedTier: 'T1', approvedTier: index === 17 ? null : 'T1', tierStatus: index === 17 ? 'pending' : 'approved', primaryRole: 'Baron', secondaryRole: 'Mid' }).returning();
    players.push({ user, registration });
  }
  await db.insert(schema.tournamentSettings).values({ name: 'Disposable draft', region: 'EU', inviteCodeHash: 'test', updatedBy: players[0].user.id });
  const [oldTeam] = await db.insert(schema.teams).values({ name: 'Old roster', status: 'submitted' }).returning();
  await db.insert(schema.teamMembers).values([
    { teamId: oldTeam.id, registrationId: players[0].registration.id, isCaptain: true, lineupPosition: 'starter', starterRole: 'Baron' },
    { teamId: oldTeam.id, registrationId: players[17].registration.id, isCaptain: false, lineupPosition: 'substitute' },
  ]);
  const organizer = { user: { id: players[0].user.id, role: 'organizer' } };
  const captains = [players[0].registration.id, players[1].registration.id];
  assert.equal((await draft.getDraftSetupData()).length, 17);
  const startForm = form({ captainId: captains, confirmRebuild: 'yes' });
  assert.equal((await actions.startCaptainDraft({}, startForm)).code, 'UNAUTHENTICATED');
  session = { user: { id: players[1].user.id, role: 'user' } };
  assert.equal((await actions.startCaptainDraft({}, startForm)).code, 'FORBIDDEN');
  session = organizer;
  assert.equal((await actions.startCaptainDraft({}, form({ captainId: captains }))).code, 'VALIDATION_ERROR');
  assert.equal((await actions.startCaptainDraft({}, form({ captainId: [captains[0], captains[0]], confirmRebuild: 'yes' }))).code, 'VALIDATION_ERROR');
  assert.equal((await db.select().from(schema.teams))[0].id, oldTeam.id, 'failed starts preserve rosters');
  const started = await actions.startCaptainDraft({}, startForm);
  assert.ok(started.success, started.error);
  let board = await draft.getDraftBoardData(players[0].user.id, { isOrganizer: true, reconcileExpired: false });
  const order = board.teams.map((team) => team.id);
  assert.deepEqual(board.teams.map((team) => team.targetMemberCount), [9, 8]);
  assert.deepEqual(board.teams.map((team) => team.name).sort(), ['Team A', 'Team B']);
  assert.equal(board.players.length, 15);
  assert.ok(new Date(board.turnEndsAt).getTime() - Date.now() > 55000, 'first turn gets 60 seconds');
  assert.equal((await db.select().from(schema.playerRegistrations)).length, 19);
  assert.equal((await db.select().from(schema.teamMembers)).length, 2);
  assert.equal((await renameTeam({}, form({ teamId: board.teams.find((team) => team.captainRegistrationId === captains[0]).id, teamName: 'Too early' }))).code, 'DRAFT_LOCKED');

  const beforePick = board.version;
  await draft.commitDraftPick({ sessionId: board.id, userId: players[0].user.id, registrationId: null, source: 'organizer', expectedVersion: board.version, requestKey: 'before-restart' });
  assert.equal((await actions.restartCaptainDraft({}, form({ sessionId: board.id, expectedVersion: beforePick }))).code, 'CONFLICT');
  board = await draft.getDraftBoardData(players[0].user.id, { reconcileExpired: false });
  session = { user: { id: players[1].user.id, role: 'user' } };
  assert.equal((await actions.restartCaptainDraft({}, form({ sessionId: board.id, expectedVersion: board.version }))).code, 'FORBIDDEN');
  session = organizer;
  assert.ok((await actions.restartCaptainDraft({}, form({ sessionId: board.id, expectedVersion: board.version }))).success);
  board = await draft.getDraftBoardData(players[0].user.id, { isOrganizer: true, reconcileExpired: false });
  assert.equal(board.status, 'paused');
  if (process.env.DRAFT_UI_FIXTURE) await writeFile(process.env.DRAFT_UI_FIXTURE, JSON.stringify({ board, players: await draft.getDraftSetupData() }));
  assert.equal(board.pausedRemainingSeconds, 60);
  assert.equal(board.turnNumber, 1);
  assert.deepEqual(board.teams.map((team) => team.id), order);
  assert.ok(board.teams.every((team) => team.memberCount === 1));
  assert.ok(board.players.every((player) => player.available));
  assert.equal(board.picks.filter((pick) => !pick.undoneAt).length, 0);
  assert.equal((await getDraftPollState(players[0].user.id)).needs_reconciliation, false);
  await draft.reconcileExpiredDraft(board.id);
  assert.equal((await db.select().from(schema.teamMembers)).length, 2, 'paused restart cannot auto-pick');
  await draft.resumeDraft(board.id);
  await assert.rejects(draft.commitDraftPick({ sessionId: board.id, userId: players[0].user.id, registrationId: null, source: 'organizer', requestKey: 'before-restart' }), (error) => error.code === 'STALE_DRAFT');

  for (let pick = 0; pick < 15; pick++) {
    board = await draft.getDraftBoardData(players[0].user.id, { reconcileExpired: false });
    assert.equal(board.status, 'active');
    await draft.commitDraftPick({ sessionId: board.id, userId: players[0].user.id, registrationId: null, source: 'organizer', expectedVersion: board.version, requestKey: `new-pick-${pick}` });
  }
  board = await draft.getDraftBoardData(players[0].user.id, { reconcileExpired: false });
  assert.equal(board.status, 'completed');
  assert.deepEqual(board.teams.map((team) => team.memberCount), [9, 8]);
  assert.ok(board.players.every((player) => !player.available));
  const ownTeam = board.teams.find((team) => team.captainRegistrationId === captains[0]);
  await db.update(schema.tournamentSettings).set({ registrationDeadline: new Date(0) });
  await db.update(schema.teams).set({ status: 'submitted', submittedAt: new Date() }).where(eq(schema.teams.id, ownTeam.id));
  assert.ok((await renameTeam({}, form({ teamId: ownTeam.id, teamName: 'Captain renamed us' }))).success, 'captain can rename after deadline and submission');
  session = { user: { id: players[2].user.id, role: 'user' } };
  assert.equal((await renameTeam({}, form({ teamId: ownTeam.id, teamName: 'Not my team' }))).code, 'NOT_TEAM_CAPTAIN');
  session = organizer;
  await draft.restartDraft(board.id, board.version);
  assert.ok((await db.select().from(schema.teams)).every((team) => team.status === 'draft' && team.submittedAt === null));
  assert.equal((await db.select().from(schema.draftPicks).where(isNull(schema.draftPicks.undoneAt))).length, 0);
  board = await draft.getDraftBoardData(players[0].user.id, { reconcileExpired: false });
  const rebuilt = await actions.startCaptainDraft({}, form({ captainId: [captains[0], players[2].registration.id], confirmRebuild: 'yes', sessionId: board.id, expectedVersion: board.version }));
  assert.ok(rebuilt.success, rebuilt.error);
  assert.notEqual(rebuilt.sessionId, board.id);
  assert.equal((await db.select().from(schema.draftSessions)).length, 1);
  assert.equal((await db.select().from(schema.draftPicks)).length, 0);
  assert.equal((await db.select().from(schema.teamMembers)).length, 2);
  console.log('PASS: automatic teams, permissions, stale requests, restart, resume, full draft, captain renaming and rebuild in disposable PostgreSQL.');
} finally {
  await pg.close();
}
