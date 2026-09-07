import { randomInt } from "node:crypto";
import {
  and,
  asc,
  desc,
  eq,
  inArray,
  isNull,
} from "drizzle-orm";
import type { AnyRelations } from "drizzle-orm/relations";
import type { NeonTransaction } from "drizzle-orm/neon-serverless";

import {
  draftPicks,
  draftPoolPlayers,
  draftSessionTeams,
  draftSessions,
  playerRegistrations,
  teamMembers,
  teams,
  tournamentParticipants,
  tournamentSettings,
  users,
} from "@/db/schema";
import { db } from "@/db";
import {
  canDraftTeamReceive,
  nextDraftCursorAfterPick,
  normalizeDraftCursor,
  shuffleDraftOrder,
  type DraftCursor,
  type DraftPoolSnapshot,
  type DraftTeamSnapshot,
} from "@/lib/snake-draft";
import type {
  DraftBoardData,
  DraftPickData,
  DraftPlayerData,
  DraftStatus,
  DraftTeamData,
  TournamentMemberData,
  TournamentTier,
} from "@/lib/tournament-types";

type DraftTransaction = NeonTransaction<AnyRelations>;
type DraftExecutor = typeof db | DraftTransaction;

const liveDraftStatuses = ["active", "paused", "needs_repair"] as const;
const TURN_SECONDS = 60;
const DELETED_PLAYER_NAME = "Deleted player";
const DELETED_PLAYER_TAG = "—";

export class DraftActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "DraftActionError";
  }
}

type SessionRow = typeof draftSessions.$inferSelect;
type MemberRow = {
  member: typeof teamMembers.$inferSelect;
  registration: typeof playerRegistrations.$inferSelect;
  user: typeof users.$inferSelect;
};

type DraftContext = {
  sessionTeams: Array<{
    sessionTeam: typeof draftSessionTeams.$inferSelect;
    team: typeof teams.$inferSelect;
  }>;
  memberRows: MemberRow[];
  poolRows: Array<{
    pool: typeof draftPoolPlayers.$inferSelect;
    registration: typeof playerRegistrations.$inferSelect;
    user: typeof users.$inferSelect;
  }>;
};

function nowPlusSeconds(now: Date, seconds: number) {
  return new Date(now.getTime() + seconds * 1000);
}

function cursorFromSession(session: SessionRow): DraftCursor {
  return {
    tier: session.currentTier,
    tierRound: session.currentTierRound,
    round: session.currentRound,
    teamIndex: session.currentTeamIndex,
    direction: session.direction,
  };
}

function cursorChanged(a: DraftCursor, b: DraftCursor) {
  return (
    a.tier !== b.tier ||
    a.tierRound !== b.tierRound ||
    a.round !== b.round ||
    a.teamIndex !== b.teamIndex ||
    a.direction !== b.direction
  );
}

function toTeamSnapshot(
  teamId: string,
  memberRows: MemberRow[],
): DraftTeamSnapshot {
  const tierCounts: Record<TournamentTier, number> = {
    T1: 0,
    T2: 0,
    T3: 0,
    T4: 0,
  };

  for (const row of memberRows) {
    if (row.registration.approvedTier) {
      tierCounts[row.registration.approvedTier] += 1;
    }
  }

  return {
    teamId,
    memberCount: memberRows.length,
    tierCounts,
  };
}

function contextTeamSnapshots(context: DraftContext) {
  return context.sessionTeams.map(({ sessionTeam }) =>
    toTeamSnapshot(
      sessionTeam.teamId,
      context.memberRows.filter((row) => row.member.teamId === sessionTeam.teamId),
    ),
  );
}

function contextPoolSnapshots(context: DraftContext): DraftPoolSnapshot[] {
  return context.poolRows.map(({ pool }) => ({
    registrationId: pool.registrationId,
    tier: pool.tier,
    available: pool.available,
  }));
}

async function getLiveSession(
  executor: DraftExecutor,
  lock = false,
): Promise<SessionRow | null> {
  if (lock) {
    await executor
      .select({ id: tournamentSettings.id })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .for("update")
      .limit(1);
  }
  let query = executor
    .select()
    .from(draftSessions)
    .where(inArray(draftSessions.status, [...liveDraftStatuses]))
    .orderBy(desc(draftSessions.createdAt))
    .limit(1);
  if (lock) query = query.for("update") as typeof query;
  const [session] = await query;
  return session ?? null;
}

async function getLatestSession(executor: DraftExecutor) {
  const [session] = await executor
    .select()
    .from(draftSessions)
    .orderBy(desc(draftSessions.createdAt))
    .limit(1);
  return session ?? null;
}

async function loadContext(
  executor: DraftExecutor,
  sessionId: string,
): Promise<DraftContext> {
  const sessionTeams = await executor
    .select({ sessionTeam: draftSessionTeams, team: teams })
    .from(draftSessionTeams)
    .innerJoin(teams, eq(draftSessionTeams.teamId, teams.id))
    .where(eq(draftSessionTeams.sessionId, sessionId))
    .orderBy(asc(draftSessionTeams.orderIndex));

  const teamIds = sessionTeams.map(({ team }) => team.id);
  const memberRows = teamIds.length
    ? await executor
        .select({ member: teamMembers, registration: playerRegistrations, user: users })
        .from(teamMembers)
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .innerJoin(users, eq(tournamentParticipants.userId, users.id))
        .where(inArray(teamMembers.teamId, teamIds))
        .orderBy(asc(teamMembers.joinedAt))
    : [];

  const poolRows = await executor
    .select({ pool: draftPoolPlayers, registration: playerRegistrations, user: users })
    .from(draftPoolPlayers)
    .innerJoin(
      playerRegistrations,
      eq(draftPoolPlayers.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(draftPoolPlayers.sessionId, sessionId))
    .orderBy(asc(playerRegistrations.riotName));

  return { sessionTeams, memberRows, poolRows };
}

function memberData(row: MemberRow): TournamentMemberData {
  const deleted = Boolean(row.user.deletedAt);
  return {
    id: row.member.id,
    registrationId: row.member.registrationId,
    isDeleted: deleted,
    displayName: deleted ? DELETED_PLAYER_NAME : row.user.displayName,
    avatarUrl: deleted ? null : row.user.avatarUrl,
    riotName: deleted ? DELETED_PLAYER_NAME : row.registration.riotName,
    riotTag: deleted ? DELETED_PLAYER_TAG : row.registration.riotTag,
    currentRank: deleted ? "Unavailable" : row.registration.currentRank,
    approvedTier: row.registration.approvedTier,
    tierStatus: row.registration.tierStatus,
    primaryRole: row.registration.primaryRole,
    secondaryRole: row.registration.secondaryRole,
    isCaptain: row.member.isCaptain,
    lineupPosition: row.member.lineupPosition,
    starterRole: row.member.starterRole,
  };
}

function teamData(
  row: { sessionTeam: typeof draftSessionTeams.$inferSelect; team: typeof teams.$inferSelect },
  memberRows: MemberRow[],
): DraftTeamData {
  const members = memberRows
    .filter((member) => member.member.teamId === row.team.id)
    .map(memberData);
  const captain = memberRows.find(
    (member) =>
      member.member.teamId === row.team.id &&
      member.member.registrationId === row.sessionTeam.captainRegistrationId,
  );
  const snapshot = toTeamSnapshot(row.team.id, memberRows.filter((member) => member.member.teamId === row.team.id));

  return {
    id: row.team.id,
    name: row.team.name,
    orderIndex: row.sessionTeam.orderIndex,
    captainRegistrationId: row.sessionTeam.captainRegistrationId,
    captainName: captain ? memberData(captain).displayName : "Unknown captain",
    captainRiotId: captain
      ? `${memberData(captain).riotName}#${memberData(captain).riotTag}`
      : "Unknown",
    memberCount: snapshot.memberCount,
    tierCounts: snapshot.tierCounts,
    incomplete: snapshot.memberCount < 5,
    members,
  };
}

function playerData(row: DraftContext["poolRows"][number]): DraftPlayerData {
  const deleted = Boolean(row.user.deletedAt);
  return {
    id: row.pool.id,
    registrationId: row.pool.registrationId,
    displayName: deleted ? DELETED_PLAYER_NAME : row.user.displayName,
    avatarUrl: deleted ? null : row.user.avatarUrl,
    riotName: deleted ? DELETED_PLAYER_NAME : row.registration.riotName,
    riotTag: deleted ? DELETED_PLAYER_TAG : row.registration.riotTag,
    currentRank: deleted ? "Unavailable" : row.registration.currentRank,
    approvedTier: row.registration.approvedTier as TournamentTier,
    primaryRole: row.registration.primaryRole,
    secondaryRole: row.registration.secondaryRole,
    available: row.pool.available,
  };
}

async function markIncompleteTeams(
  executor: DraftExecutor,
  sessionId: string,
  context: DraftContext,
) {
  const snapshots = contextTeamSnapshots(context);
  const incompleteTeamIds = snapshots
    .filter((team) => team.memberCount < 5)
    .map((team) => team.teamId);

  for (const { sessionTeam } of context.sessionTeams) {
    await executor
      .update(draftSessionTeams)
      .set({
        incomplete: incompleteTeamIds.includes(sessionTeam.teamId),
      })
      .where(
        and(
          eq(draftSessionTeams.sessionId, sessionId),
          eq(draftSessionTeams.teamId, sessionTeam.teamId),
        ),
      );
  }

  return incompleteTeamIds;
}

export async function getDraftModeState() {
  const session = await getLatestSession(db);
  return session
    ? {
        id: session.id,
        status: session.status,
        startedAt: session.startedAt.toISOString(),
      }
    : null;
}

export async function assertDraftTeamUnlocked(
  executor: DraftExecutor,
  teamId: string,
) {
  const session = await getLiveSession(executor, true);
  if (!session || session.status === "needs_repair") return;
  const [locked] = await executor
    .select({ id: draftSessionTeams.id })
    .from(draftSessionTeams)
    .where(
      and(
        eq(draftSessionTeams.sessionId, session.id),
        eq(draftSessionTeams.teamId, teamId),
      ),
    )
    .limit(1);
  if (locked) {
    throw new DraftActionError(
      "DRAFT_LOCKED",
      "This team is locked while the captain draft is in progress.",
    );
  }
}

export async function assertDraftRegistrationUnlocked(
  executor: DraftExecutor,
  registrationId: string,
) {
  const session = await getLiveSession(executor, true);
  if (!session || session.status === "needs_repair") return;
  const [poolPlayer] = await executor
    .select({ id: draftPoolPlayers.id })
    .from(draftPoolPlayers)
    .where(
      and(
        eq(draftPoolPlayers.sessionId, session.id),
        eq(draftPoolPlayers.registrationId, registrationId),
      ),
    )
    .limit(1);
  const [teamMember] = await executor
    .select({ id: teamMembers.id })
    .from(draftSessionTeams)
    .innerJoin(teamMembers, eq(draftSessionTeams.teamId, teamMembers.teamId))
    .where(
      and(
        eq(draftSessionTeams.sessionId, session.id),
        eq(teamMembers.registrationId, registrationId),
      ),
    )
    .limit(1);
  if (poolPlayer || teamMember) {
    throw new DraftActionError(
      "DRAFT_LOCKED",
      "This player is locked while the captain draft is in progress.",
    );
  }
}

export async function startDraft({
  organizerId,
  teamIds,
}: {
  organizerId: string;
  teamIds: string[];
}) {
  return db.transaction(async (tx) => {
    const activeSession = await getLiveSession(tx, true);
    const [settings] = await tx
      .select({ id: tournamentSettings.id })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .limit(1);
    if (!settings) {
      throw new DraftActionError(
        "TOURNAMENT_NOT_CONFIGURED",
        "The tournament has not been set up yet.",
      );
    }
    if (activeSession) {
      throw new DraftActionError("DRAFT_ALREADY_ACTIVE", "A captain draft is already active.");
    }

    const selectedIds = [...new Set(teamIds)];
    if (selectedIds.length === 0) {
      throw new DraftActionError("VALIDATION_ERROR", "Choose at least one captain-only team.");
    }

    const rows = await tx
      .select({ team: teams, member: teamMembers, registration: playerRegistrations, user: users })
      .from(teams)
      .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .innerJoin(
        playerRegistrations,
        eq(teamMembers.registrationId, playerRegistrations.id),
      )
      .innerJoin(
        tournamentParticipants,
        eq(playerRegistrations.participantId, tournamentParticipants.id),
      )
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(inArray(teams.id, selectedIds))
      .orderBy(asc(teams.createdAt), asc(teamMembers.joinedAt))
      .for("update");

    const byTeam = new Map<string, typeof rows>();
    for (const row of rows) {
      const current = byTeam.get(row.team.id) ?? [];
      current.push(row);
      byTeam.set(row.team.id, current);
    }

    const captainTeams = selectedIds.map((teamId) => {
      const members = byTeam.get(teamId) ?? [];
      const [captain] = members.filter(({ member }) => member.isCaptain);
      if (
        members.length !== 1 ||
        !captain ||
        captain.team.status !== "draft" ||
        captain.user.deletedAt ||
        !captain.registration.approvedTier
      ) {
        throw new DraftActionError(
          "TEAM_NOT_ELIGIBLE",
          "Only draft teams with one approved playing captain can enter the draft.",
        );
      }
      return { teamId, captain };
    });

    const lockedCaptainIds = captainTeams.map(({ captain }) => captain.registration.id);
    const poolRows = await tx
      .select({ registration: playerRegistrations, user: users })
      .from(playerRegistrations)
      .innerJoin(
        tournamentParticipants,
        eq(playerRegistrations.participantId, tournamentParticipants.id),
      )
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(
        and(
          eq(playerRegistrations.tierStatus, "approved"),
          isNull(users.deletedAt),
        ),
      );
    const currentTeamPlayers = await tx
      .select({ registrationId: teamMembers.registrationId })
      .from(teamMembers)
      .for("update");
    const currentTeamPlayerIds = new Set(
      currentTeamPlayers.map(({ registrationId }) => registrationId),
    );
    const pool = poolRows.filter(
      ({ registration }) =>
        !currentTeamPlayerIds.has(registration.id) &&
        !lockedCaptainIds.includes(registration.id),
    );

    const [session] = await tx
      .insert(draftSessions)
      .values({ createdBy: organizerId })
      .returning();
    const order = shuffleDraftOrder(captainTeams, () => randomInt(0, 1_000_000) / 1_000_000);

    await tx.insert(draftSessionTeams).values(
      order.map(({ teamId, captain }, orderIndex) => ({
        sessionId: session.id,
        teamId,
        orderIndex,
        captainRegistrationId: captain.registration.id,
        initialMemberCount: 1,
      })),
    );
    if (pool.length > 0) {
      await tx.insert(draftPoolPlayers).values(
        pool.map(({ registration }) => ({
          sessionId: session.id,
          registrationId: registration.id,
          tier: registration.approvedTier as TournamentTier,
        })),
      );
    }

    const context = await loadContext(tx, session.id);
    const normalized = normalizeDraftCursor(
      cursorFromSession(session),
      contextTeamSnapshots(context),
      contextPoolSnapshots(context),
    );
    const normalizedAt = new Date();
    if (normalized.completed) {
      const incomplete = (await markIncompleteTeams(tx, session.id, context)).length > 0;
      await tx
        .update(draftSessions)
        .set({
          status: incomplete ? "needs_repair" : "completed",
          completedAt: normalizedAt,
          version: session.version + 1,
          updatedAt: normalizedAt,
        })
        .where(eq(draftSessions.id, session.id));
    } else if (cursorChanged(cursorFromSession(session), normalized.cursor)) {
      await tx
        .update(draftSessions)
        .set({
          currentTier: normalized.cursor.tier,
          currentRound: normalized.cursor.round,
          currentTierRound: normalized.cursor.tierRound,
          currentTeamIndex: normalized.cursor.teamIndex,
          direction: normalized.cursor.direction,
          turnStartedAt: normalizedAt,
          turnEndsAt: nowPlusSeconds(normalizedAt, TURN_SECONDS),
          version: session.version + 1,
          updatedAt: normalizedAt,
        })
        .where(eq(draftSessions.id, session.id));
    }

    return { sessionId: session.id, teamCount: order.length, poolCount: pool.length };
  });
}

async function chooseRandomPlayer(
  executor: DraftExecutor,
  context: DraftContext,
  session: SessionRow,
  requestedRegistrationId: string | null,
) {
  const teamsSnapshot = contextTeamSnapshots(context);
  const currentTeam = teamsSnapshot[session.currentTeamIndex];
  if (!currentTeam) {
    throw new DraftActionError("DRAFT_COMPLETE", "The draft has no remaining turns.");
  }

  const eligible = context.poolRows.filter(
    ({ pool }) =>
      pool.available &&
      pool.tier === session.currentTier &&
      canDraftTeamReceive(currentTeam, session.currentTier),
  );
  if (eligible.length === 0) {
    throw new DraftActionError("NO_ELIGIBLE_PLAYERS", "No eligible player remains for this turn.");
  }

  if (requestedRegistrationId) {
    const requested = eligible.find(
      ({ pool }) => pool.registrationId === requestedRegistrationId,
    );
    if (!requested) {
      throw new DraftActionError(
        "PLAYER_UNAVAILABLE",
        "That player is no longer available for this turn.",
      );
    }
    return requested;
  }

  return eligible[randomInt(0, eligible.length)];
}

async function commitPickLocked(
  tx: DraftTransaction,
  session: SessionRow,
  context: DraftContext,
  options: {
    userId: string | null;
    registrationId: string | null;
    source: "captain" | "organizer" | "auto";
    requestKey: string | null;
    now: Date;
    forceAuto?: boolean;
  },
) {
  if (session.status !== "active") {
    throw new DraftActionError(
      session.status === "paused" ? "DRAFT_PAUSED" : "DRAFT_NOT_ACTIVE",
      session.status === "paused"
        ? "The draft is paused. Resume it before picking."
        : "This draft is no longer accepting picks.",
    );
  }

  if (options.requestKey) {
    const [existing] = await tx
      .select({ id: draftPicks.id, registrationId: draftPicks.registrationId })
      .from(draftPicks)
      .where(
        and(
          eq(draftPicks.sessionId, session.id),
          eq(draftPicks.requestKey, options.requestKey),
          isNull(draftPicks.undoneAt),
        ),
      )
      .limit(1);
    if (existing) return { pickId: existing.id, replayed: true };
  }

  const currentTeam = context.sessionTeams[session.currentTeamIndex];
  if (!currentTeam) {
    throw new DraftActionError("DRAFT_COMPLETE", "The draft has no remaining turns.");
  }
  const captain = context.memberRows.find(
    (row) =>
      row.member.teamId === currentTeam.team.id &&
      row.member.registrationId === currentTeam.sessionTeam.captainRegistrationId,
  );
  if (!captain) {
    throw new DraftActionError("DRAFT_INVALID", "The current captain could not be found.");
  }
  if (options.source === "captain" && captain.user.id !== options.userId) {
    throw new DraftActionError("NOT_CURRENT_CAPTAIN", "Wait for your team's turn before picking.");
  }

  const expired = session.status === "active" && session.turnEndsAt.getTime() <= options.now.getTime();
  const source = expired || options.forceAuto ? "auto" : options.source;
  const selected = await chooseRandomPlayer(
    tx,
    context,
    session,
    source === "auto" ? null : options.registrationId,
  );
  const [claimed] = await tx
    .update(draftPoolPlayers)
    .set({ available: false, pickedAt: options.now })
    .where(
      and(
        eq(draftPoolPlayers.id, selected.pool.id),
        eq(draftPoolPlayers.available, true),
      ),
    )
    .returning({ id: draftPoolPlayers.id });
  if (!claimed) {
    throw new DraftActionError("CONFLICT", "That player was just picked. Refresh the draft board.");
  }

  const [member] = await tx
    .insert(teamMembers)
    .values({
      teamId: currentTeam.team.id,
      registrationId: selected.pool.registrationId,
      isCaptain: false,
      lineupPosition: "substitute",
      starterRole: null,
      joinedAt: options.now,
    })
    .returning({ id: teamMembers.id });

  const before = cursorFromSession(session);
  const nextContext = await loadContext(tx, session.id);
  const transition = nextDraftCursorAfterPick(
    before,
    contextTeamSnapshots(nextContext),
    contextPoolSnapshots(nextContext),
  );
  const incompleteTeamIds = await markIncompleteTeams(tx, session.id, nextContext);
  const allFull = incompleteTeamIds.length === 0;
  const status: DraftStatus = transition.completed
    ? allFull
      ? "completed"
      : "needs_repair"
    : "active";

  const [pick] = await tx
    .insert(draftPicks)
    .values({
      sessionId: session.id,
      turnNumber: session.turnNumber,
      round: before.round,
      tier: before.tier,
      direction: before.direction,
      previousTier: before.tier,
      previousRound: before.round,
      previousTierRound: before.tierRound,
      previousTeamIndex: before.teamIndex,
      previousDirection: before.direction,
      teamId: currentTeam.team.id,
      captainRegistrationId: currentTeam.sessionTeam.captainRegistrationId,
      registrationId: selected.pool.registrationId,
      source,
      requestKey: options.requestKey,
      createdBy: options.userId,
      committedAt: options.now,
    })
    .returning({ id: draftPicks.id });

  await tx
    .update(draftSessions)
    .set({
      currentTier: transition.cursor.tier,
      currentRound: transition.cursor.round,
      currentTierRound: transition.cursor.tierRound,
      currentTeamIndex: transition.cursor.teamIndex,
      direction: transition.cursor.direction,
      turnNumber: session.turnNumber + 1,
      status,
      version: session.version + 1,
      turnStartedAt: transition.completed ? session.turnStartedAt : options.now,
      turnEndsAt: transition.completed
        ? session.turnEndsAt
        : nowPlusSeconds(options.now, TURN_SECONDS),
      pausedRemainingSeconds: null,
      completedAt: transition.completed ? options.now : null,
      updatedAt: options.now,
    })
    .where(eq(draftSessions.id, session.id));

  void member;
  return {
    pickId: pick.id,
    replayed: false,
    source,
    registrationId: selected.pool.registrationId,
    status,
  };
}

export async function commitDraftPick({
  sessionId,
  userId,
  registrationId,
  expectedVersion,
  source,
  requestKey,
}: {
  sessionId: string;
  userId: string;
  registrationId: string | null;
  expectedVersion?: number;
  source: "captain" | "organizer";
  requestKey?: string | null;
}) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(draftSessions)
      .where(eq(draftSessions.id, sessionId))
      .for("update")
      .limit(1);
    if (!session) throw new DraftActionError("NOT_FOUND", "That draft no longer exists.");
    if (requestKey) {
      const [existing] = await tx
        .select({ id: draftPicks.id })
        .from(draftPicks)
        .where(
          and(
            eq(draftPicks.sessionId, session.id),
            eq(draftPicks.requestKey, requestKey),
            isNull(draftPicks.undoneAt),
          ),
        )
        .limit(1);
      if (existing) return { pickId: existing.id, replayed: true };
    }
    if (expectedVersion !== undefined && expectedVersion !== session.version) {
      throw new DraftActionError("STALE_DRAFT", "The board changed. Refresh before picking.");
    }
    const context = await loadContext(tx, session.id);
    const now = new Date();
    return commitPickLocked(tx, session, context, {
      userId,
      registrationId,
      source,
      requestKey: requestKey ?? null,
      now,
    });
  });
}

export async function reconcileExpiredDraft(sessionId?: string) {
  return db.transaction(async (tx) => {
    const session = sessionId
      ? (
          await tx
            .select()
            .from(draftSessions)
            .where(eq(draftSessions.id, sessionId))
            .for("update")
            .limit(1)
        )[0]
      : await getLiveSession(tx, true);
    if (!session || session.status !== "active") return null;
    const now = new Date();
    if (session.turnEndsAt.getTime() > now.getTime()) return session;
    const context = await loadContext(tx, session.id);
    await commitPickLocked(tx, session, context, {
      userId: null,
      registrationId: null,
      source: "auto",
      requestKey: null,
      now,
      forceAuto: true,
    });
    return session;
  });
}

async function reconcileDraftRepair() {
  return db.transaction(async (tx) => {
    const session = await getLiveSession(tx, true);
    if (!session || session.status !== "needs_repair") return null;
    const context = await loadContext(tx, session.id);
    const incompleteTeamIds = await markIncompleteTeams(tx, session.id, context);
    if (incompleteTeamIds.length > 0) return session;

    const now = new Date();
    await tx
      .update(draftSessions)
      .set({
        status: "completed",
        completedAt: now,
        version: session.version + 1,
        updatedAt: now,
      })
      .where(eq(draftSessions.id, session.id));
    return { ...session, status: "completed" as const, completedAt: now };
  });
}

export async function pauseDraft(sessionId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(draftSessions)
      .where(eq(draftSessions.id, sessionId))
      .for("update")
      .limit(1);
    if (!session || session.status !== "active") {
      throw new DraftActionError("DRAFT_NOT_ACTIVE", "Only an active draft can be paused.");
    }
    const now = new Date();
    const remaining = Math.max(
      0,
      Math.ceil((session.turnEndsAt.getTime() - now.getTime()) / 1000),
    );
    await tx
      .update(draftSessions)
      .set({
        status: "paused",
        pausedRemainingSeconds: remaining,
        turnStartedAt: now,
        turnEndsAt: now,
        version: session.version + 1,
        updatedAt: now,
      })
      .where(eq(draftSessions.id, session.id));
    return { remainingSeconds: remaining };
  });
}

export async function resumeDraft(sessionId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(draftSessions)
      .where(eq(draftSessions.id, sessionId))
      .for("update")
      .limit(1);
    if (!session || session.status !== "paused") {
      throw new DraftActionError("DRAFT_NOT_PAUSED", "Only a paused draft can be resumed.");
    }
    const now = new Date();
    const remaining = Math.max(0, session.pausedRemainingSeconds ?? 0);
    await tx
      .update(draftSessions)
      .set({
        status: "active",
        pausedRemainingSeconds: null,
        turnStartedAt: now,
        turnEndsAt: nowPlusSeconds(now, remaining),
        version: session.version + 1,
        updatedAt: now,
      })
      .where(eq(draftSessions.id, session.id));
    if (remaining === 0) {
      const context = await loadContext(tx, session.id);
      return commitPickLocked(tx, { ...session, status: "active" }, context, {
        userId: null,
        registrationId: null,
        source: "auto",
        requestKey: null,
        now,
        forceAuto: true,
      });
    }
    return { remainingSeconds: remaining };
  });
}

export async function adjustDraftTimer(sessionId: string, deltaSeconds: number) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(draftSessions)
      .where(eq(draftSessions.id, sessionId))
      .for("update")
      .limit(1);
    if (
      !session ||
      !liveDraftStatuses.includes(
        session.status as (typeof liveDraftStatuses)[number],
      )
    ) {
      throw new DraftActionError("DRAFT_NOT_ACTIVE", "This draft is no longer live.");
    }
    const now = new Date();
    if (session.status === "active" && session.turnEndsAt.getTime() <= now.getTime()) {
      const context = await loadContext(tx, session.id);
      const result = await commitPickLocked(
        tx,
        session,
        context,
        {
          userId: null,
          registrationId: null,
          source: "auto",
          requestKey: null,
          now,
          forceAuto: true,
        },
      );
      return { ...result, remainingSeconds: 0, autoPicked: true };
    }
    if (session.status === "paused") {
      const remaining = Math.max(
        0,
        (session.pausedRemainingSeconds ?? 0) + deltaSeconds,
      );
      await tx
        .update(draftSessions)
        .set({
          pausedRemainingSeconds: remaining,
          version: session.version + 1,
          updatedAt: now,
        })
        .where(eq(draftSessions.id, session.id));
      return { remainingSeconds: remaining, autoPicked: false };
    }

    const currentRemaining = Math.max(
      0,
      Math.ceil((session.turnEndsAt.getTime() - now.getTime()) / 1000),
    );
    const remaining = Math.max(0, currentRemaining + deltaSeconds);
    await tx
      .update(draftSessions)
      .set({
        turnEndsAt: nowPlusSeconds(now, remaining),
        version: session.version + 1,
        updatedAt: now,
      })
      .where(eq(draftSessions.id, session.id));
    if (remaining === 0) {
      const context = await loadContext(tx, session.id);
      const result = await commitPickLocked(
        tx,
        { ...session, turnEndsAt: now, status: "active" },
        context,
        {
          userId: null,
          registrationId: null,
          source: "auto",
          requestKey: null,
          now,
          forceAuto: true,
        },
      );
      return { ...result, remainingSeconds: 0, autoPicked: true };
    }
    return { remainingSeconds: remaining, autoPicked: false };
  });
}

export async function undoLatestDraftPick(sessionId: string) {
  return db.transaction(async (tx) => {
    const [session] = await tx
      .select()
      .from(draftSessions)
      .where(eq(draftSessions.id, sessionId))
      .for("update")
      .limit(1);
    if (!session) {
      throw new DraftActionError("DRAFT_NOT_ACTIVE", "This draft is no longer available for undo.");
    }
    const [pick] = await tx
      .select()
      .from(draftPicks)
      .where(
        and(eq(draftPicks.sessionId, session.id), isNull(draftPicks.undoneAt)),
      )
      .orderBy(desc(draftPicks.turnNumber), desc(draftPicks.committedAt))
      .limit(1);
    if (!pick) throw new DraftActionError("NOT_FOUND", "There is no pick to undo.");

    const now = new Date();
    const [membership] = await tx
      .select({ id: teamMembers.id })
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.teamId, pick.teamId),
          eq(teamMembers.registrationId, pick.registrationId),
          eq(teamMembers.isCaptain, false),
        ),
      )
      .limit(1);
    if (!membership) {
      throw new DraftActionError("CONFLICT", "The picked player is no longer removable from this roster.");
    }

    await tx
      .update(draftPicks)
      .set({ undoneAt: now })
      .where(eq(draftPicks.id, pick.id));
    await tx.delete(teamMembers).where(eq(teamMembers.id, membership.id));
    await tx
      .update(draftPoolPlayers)
      .set({ available: true, pickedAt: null })
      .where(
        and(
          eq(draftPoolPlayers.sessionId, session.id),
          eq(draftPoolPlayers.registrationId, pick.registrationId),
        ),
      );
    const nextContext = await loadContext(tx, session.id);
    await markIncompleteTeams(tx, session.id, nextContext);
    await tx
      .update(draftSessions)
      .set({
        status: "active",
        currentTier: pick.previousTier,
        currentRound: pick.previousRound,
        currentTierRound: pick.previousTierRound,
        currentTeamIndex: pick.previousTeamIndex,
        direction: pick.previousDirection,
        turnNumber: pick.turnNumber,
        turnStartedAt: now,
        turnEndsAt: nowPlusSeconds(now, TURN_SECONDS),
        pausedRemainingSeconds: null,
        completedAt: null,
        version: session.version + 1,
        updatedAt: now,
      })
      .where(eq(draftSessions.id, session.id));

    return { pickId: pick.id };
  });
}

export async function getDraftBoardData(
  userId: string,
  options: { reconcileExpired?: boolean; isOrganizer?: boolean } = {},
): Promise<DraftBoardData | null> {
  if (options.reconcileExpired ?? true) {
    await reconcileExpiredDraft();
    await reconcileDraftRepair();
  }

  const session = await getLatestSession(db);
  if (!session) return null;
  const context = await loadContext(db, session.id);
  const teamDataRows = context.sessionTeams.map((row) =>
    teamData(row, context.memberRows),
  );
  const poolData = context.poolRows.map(playerData);
  const pickRows = await db
    .select({
      pick: draftPicks,
      team: teams,
      registration: playerRegistrations,
      user: users,
    })
    .from(draftPicks)
    .innerJoin(teams, eq(draftPicks.teamId, teams.id))
    .innerJoin(
      playerRegistrations,
      eq(draftPicks.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(draftPicks.sessionId, session.id))
    .orderBy(asc(draftPicks.turnNumber), asc(draftPicks.committedAt));

  const picks: DraftPickData[] = pickRows.map(({ pick, team, registration, user }) => ({
    id: pick.id,
    turnNumber: pick.turnNumber,
    round: pick.round,
    tier: pick.tier,
    direction: pick.direction,
    teamId: team.id,
    teamName: team.name,
    registrationId: pick.registrationId,
    displayName: user.deletedAt ? DELETED_PLAYER_NAME : user.displayName,
    riotName: user.deletedAt ? DELETED_PLAYER_NAME : registration.riotName,
    riotTag: user.deletedAt ? DELETED_PLAYER_TAG : registration.riotTag,
    source: pick.source,
    committedAt: pick.committedAt.toISOString(),
    undoneAt: pick.undoneAt?.toISOString() ?? null,
  }));

  const [viewerRegistration] = await db
    .select({ id: playerRegistrations.id })
    .from(playerRegistrations)
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .where(eq(tournamentParticipants.userId, userId))
    .limit(1);
  const currentTeam = context.sessionTeams[session.currentTeamIndex];
  const currentTeamData = currentTeam
    ? teamData(currentTeam, context.memberRows)
    : null;
  const currentCaptain = currentTeam
    ? context.memberRows.find(
        (row) =>
          row.member.teamId === currentTeam.team.id &&
          row.member.registrationId === currentTeam.sessionTeam.captainRegistrationId,
      )
    : null;
  const currentCaptainUserId = currentCaptain?.user.id ?? null;
  const nextTeamIndex = currentTeam
    ? session.direction === "forward"
      ? Math.min(session.currentTeamIndex + 1, context.sessionTeams.length - 1)
      : Math.max(session.currentTeamIndex - 1, 0)
    : -1;
  const latestPick = picks.filter((pick) => !pick.undoneAt).at(-1);

  return {
    id: session.id,
    status: session.status,
    currentTier: session.currentTier,
    currentRound: session.currentRound,
    currentTierRound: session.currentTierRound,
    direction: session.direction,
    turnNumber: session.turnNumber,
    version: session.version,
    turnStartedAt: session.turnStartedAt.toISOString(),
    turnEndsAt: session.turnEndsAt.toISOString(),
    pausedRemainingSeconds: session.pausedRemainingSeconds,
    currentTeamId: currentTeamData?.id ?? null,
    currentCaptainName: currentCaptain
      ? currentCaptain.user.deletedAt
        ? DELETED_PLAYER_NAME
        : currentCaptain.user.displayName
      : null,
    currentCaptainUserId,
    nextTeamId:
      nextTeamIndex >= 0 ? context.sessionTeams[nextTeamIndex]?.team.id ?? null : null,
    teams: teamDataRows,
    players: poolData,
    picks,
    incompleteTeamIds: teamDataRows
      .filter((team) => team.incomplete)
      .map((team) => team.id),
    viewer: {
      registrationId: viewerRegistration?.id ?? null,
      isOrganizer: Boolean(options.isOrganizer),
      isCurrentCaptain: currentCaptainUserId === userId,
      canPick:
        session.status === "active" &&
        (currentCaptainUserId === userId || Boolean(options.isOrganizer)),
      canUndo: Boolean(latestPick) && Boolean(options.isOrganizer),
    },
  };
}

export async function getDraftSetupData() {
  const rows = await db
    .select({ team: teams, member: teamMembers, registration: playerRegistrations, user: users })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .innerJoin(
      playerRegistrations,
      eq(teamMembers.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .orderBy(asc(teams.createdAt), asc(teamMembers.joinedAt));

  const byTeam = new Map<string, typeof rows>();
  for (const row of rows) {
    const current = byTeam.get(row.team.id) ?? [];
    current.push(row);
    byTeam.set(row.team.id, current);
  }
  return [...byTeam.values()]
    .map((members) => {
      const captain = members.find(({ member }) => member.isCaptain);
      if (!captain) return null;
      return {
        id: members[0].team.id,
        name: members[0].team.name,
        status: members[0].team.status,
        captainRegistrationId: captain.registration.id,
        captainName: captain.user.deletedAt ? DELETED_PLAYER_NAME : captain.user.displayName,
        captainRiotId: captain.user.deletedAt
          ? `${DELETED_PLAYER_NAME}#${DELETED_PLAYER_TAG}`
          : `${captain.registration.riotName}#${captain.registration.riotTag}`,
        memberCount: members.length,
        approved: Boolean(captain.registration.approvedTier),
        eligible:
          members.length === 1 &&
          members[0].member.isCaptain &&
          members[0].team.status === "draft" &&
          !captain.user.deletedAt &&
          Boolean(captain.registration.approvedTier),
      };
    })
    .filter((team): team is NonNullable<typeof team> => Boolean(team));
}
