import { and, asc, count, eq, inArray } from "drizzle-orm";
import type { AnyRelations } from "drizzle-orm/relations";
import type { NeonTransaction } from "drizzle-orm/neon-serverless";

import {
  fixtureCompetitions,
  fixtureEntries,
  fixtureMatches,
  teamMembers,
  teams,
  tournamentSettings,
} from "@/db/schema";
import { db } from "@/db";
import { generateRoundRobin } from "@/lib/fixture-pairings";
import {
  calculateStandings,
  isValidSeriesScore,
  matchWinner,
  validatePlayoffOrder,
} from "@/lib/fixture-rules";
import type {
  FixtureBoard,
  FixtureEntry,
  FixtureMatch,
  FixturePhase,
  FixtureTeamOption,
} from "@/lib/fixture-types";

type FixtureTransaction = NeonTransaction<AnyRelations>;
type FixtureExecutor = typeof db | FixtureTransaction;
type CompetitionRow = typeof fixtureCompetitions.$inferSelect;

const COMPETITION_ID = 1;

export class FixtureActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "FixtureActionError";
  }
}

function phaseError(phase: FixturePhase, expected: FixturePhase | FixturePhase[]) {
  const expectedPhases = Array.isArray(expected) ? expected : [expected];
  if (expectedPhases.includes(phase)) return;
  throw new FixtureActionError(
    "FIXTURE_PHASE_CONFLICT",
    "That fixture action is not available in the current phase.",
  );
}

function assertExpectedVersion(currentVersion: number, expectedVersion: number) {
  if (!Number.isSafeInteger(expectedVersion) || expectedVersion !== currentVersion) {
    throw new FixtureActionError(
      "FIXTURE_VERSION_CONFLICT",
      "The fixture schedule changed. Refresh and try again.",
    );
  }
}

async function lockTournamentSettings(executor: FixtureExecutor) {
  const [settings] = await executor
    .select({ id: tournamentSettings.id })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .for("update")
    .limit(1);

  if (!settings) {
    throw new FixtureActionError(
      "TOURNAMENT_NOT_CONFIGURED",
      "The tournament has not been configured yet.",
    );
  }
}

async function getCompetition(
  executor: FixtureExecutor,
  lock = false,
): Promise<CompetitionRow | null> {
  let query = executor
    .select()
    .from(fixtureCompetitions)
    .where(eq(fixtureCompetitions.id, COMPETITION_ID))
    .limit(1);
  if (lock) query = query.for("update") as typeof query;
  const [competition] = await query;
  return competition ?? null;
}

async function requireCompetition(
  executor: FixtureExecutor,
  lock = false,
): Promise<CompetitionRow> {
  const competition = await getCompetition(executor, lock);
  if (!competition) {
    throw new FixtureActionError(
      "FIXTURES_NOT_PREPARED",
      "Fixture scheduling has not been prepared yet.",
    );
  }
  return competition;
}

async function bumpCompetitionVersion(
  executor: FixtureExecutor,
  competition: CompetitionRow,
  phase: FixturePhase = competition.phase,
  playoffOrder: string[] | null | undefined = undefined,
) {
  await executor
    .update(fixtureCompetitions)
    .set({
      version: competition.version + 1,
      phase,
      ...(playoffOrder === undefined ? {} : { playoffOrder }),
      updatedAt: new Date(),
    })
    .where(eq(fixtureCompetitions.id, competition.id));
}

async function withLockedCompetition<T>(
  expectedVersion: number,
  operation: (
    executor: FixtureTransaction,
    competition: CompetitionRow,
  ) => Promise<T>,
) {
  return db.transaction(async (tx) => {
    await lockTournamentSettings(tx);
    const competition = await requireCompetition(tx, true);
    assertExpectedVersion(competition.version, expectedVersion);
    return operation(tx, competition);
  });
}

function toFixtureMatch(row: typeof fixtureMatches.$inferSelect): FixtureMatch {
  return {
    id: row.id,
    stage: row.stage,
    round: row.round,
    position: row.position,
    homeTeamId: row.homeTeamId,
    awayTeamId: row.awayTeamId,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    scheduledAt: row.scheduledAt?.toISOString() ?? null,
  };
}

async function loadFixtureRows(executor: FixtureExecutor, competitionId: number) {
  const entryRows = await executor
    .select({
      teamId: teams.id,
      name: teams.name,
      seed: fixtureEntries.seed,
    })
    .from(fixtureEntries)
    .innerJoin(teams, eq(fixtureEntries.teamId, teams.id))
    .where(eq(fixtureEntries.competitionId, competitionId))
    .orderBy(asc(fixtureEntries.seed));

  const matchRows = await executor
    .select()
    .from(fixtureMatches)
    .where(eq(fixtureMatches.competitionId, competitionId))
    .orderBy(
      asc(fixtureMatches.stage),
      asc(fixtureMatches.round),
      asc(fixtureMatches.position),
    );

  const entries: FixtureEntry[] = entryRows.map((entry) => ({
    teamId: entry.teamId,
    name: entry.name,
    seed: entry.seed,
  }));

  return {
    entries,
    matches: matchRows.map(toFixtureMatch),
  };
}

/** Load the public fixture board, or the private draft board for organizers. */
export async function getFixtureBoard(
  isOrganizer = false,
): Promise<FixtureBoard | null> {
  return db.transaction(async (tx) => {
    const competition = await getCompetition(tx);
    if (!competition || (competition.phase === "draft" && !isOrganizer)) return null;
    const { entries, matches } = await loadFixtureRows(tx, competition.id);
    if (entries.length === 0) return null;
    return {
      version: competition.version,
      phase: competition.phase,
      entries,
      matches,
      standings: calculateStandings(entries, matches),
      playoffOrder: competition.playoffOrder,
    };
  }, { isolationLevel: "repeatable read", accessMode: "read only" });
}

/** Return all teams that an organizer can include in the schedule. */
export async function getFixtureTeamOptions(): Promise<FixtureTeamOption[]> {
  const rows = await db
    .select({
      id: teams.id,
      name: teams.name,
      status: teams.status,
      memberCount: count(teamMembers.id),
      createdAt: teams.createdAt,
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teamMembers.teamId, teams.id))
    .groupBy(teams.id, teams.name, teams.status, teams.createdAt)
    .orderBy(asc(teams.createdAt), asc(teams.name));

  return rows.map((team) => ({
    id: team.id,
    name: team.name,
    status: team.status,
    memberCount: Number(team.memberCount),
  }));
}

/** Prepare a private round robin; an existing schedule must be discarded first. */
export async function prepareFixtures(teamIds: readonly string[]): Promise<FixtureBoard> {
  if (teamIds.length < 4) {
    throw new FixtureActionError(
      "FIXTURE_TEAM_COUNT",
      "Select at least four teams before preparing fixtures.",
    );
  }

  const uniqueTeamIds = new Set(teamIds);
  if (uniqueTeamIds.size !== teamIds.length || teamIds.some((teamId) => !teamId)) {
    throw new FixtureActionError(
      "FIXTURE_TEAM_SELECTION",
      "Choose each team once when preparing fixtures.",
    );
  }

  await db.transaction(async (tx) => {
    await lockTournamentSettings(tx);
    const current = await getCompetition(tx, true);
    if (current && current.phase !== "draft") {
      throw new FixtureActionError(
        "FIXTURES_LOCKED",
        "Published fixtures cannot be replaced.",
      );
    }

    const existingTeams = await tx
      .select({ id: teams.id })
      .from(teams)
      .where(inArray(teams.id, [...uniqueTeamIds]));
    if (existingTeams.length !== uniqueTeamIds.size) {
      throw new FixtureActionError(
        "FIXTURE_TEAM_SELECTION",
        "One or more selected teams could not be found.",
      );
    }

    if (current) {
      const [entry] = await tx.select({ id: fixtureEntries.id }).from(fixtureEntries)
        .where(eq(fixtureEntries.competitionId, current.id)).limit(1);
      if (entry) throw new FixtureActionError("FIXTURES_EXIST", "Discard the current draft before preparing another schedule.");
      await bumpCompetitionVersion(tx, current, "draft", null);
    } else {
      await tx.insert(fixtureCompetitions).values({ id: COMPETITION_ID, version: 1, phase: "draft" });
    }

    await tx.insert(fixtureEntries).values(
      teamIds.map((teamId, index) => ({
        competitionId: COMPETITION_ID,
        teamId,
        seed: index + 1,
      })),
    );

    const leagueMatches = generateRoundRobin(teamIds).map((match, index) => ({
      competitionId: COMPETITION_ID,
      stage: "league" as const,
      round: match.round,
      position: index + 1,
      homeTeamId: match.homeTeamId,
      awayTeamId: match.awayTeamId,
    }));

    const playoffMatches = [
      { stage: "semifinal" as const, round: 1, position: 1 },
      { stage: "semifinal" as const, round: 1, position: 2 },
      { stage: "final" as const, round: 2, position: 1 },
    ].map((match) => ({
      competitionId: COMPETITION_ID,
      ...match,
    }));

    await tx.insert(fixtureMatches).values([...leagueMatches, ...playoffMatches]);
  });

  const board = await getFixtureBoard(true);
  if (!board) {
    throw new FixtureActionError(
      "FIXTURES_NOT_PREPARED",
      "Fixture scheduling could not be loaded after preparation.",
    );
  }
  return board;
}

/** Make the prepared schedule visible and open the league. */
export async function publishFixtures(expectedVersion: number): Promise<void> {
  await withLockedCompetition(expectedVersion, async (tx, competition) => {
    phaseError(competition.phase, "draft");
    const { entries } = await loadFixtureRows(tx, competition.id);
    if (entries.length < 4) throw new FixtureActionError("FIXTURES_NOT_PREPARED", "Prepare a schedule before publishing it.");
    await bumpCompetitionVersion(tx, competition, "league", null);
  });
}

function validScheduledAt(scheduledAt: Date | null) {
  return scheduledAt === null || !Number.isNaN(scheduledAt.getTime());
}

/** Change a match's optional scheduled time in any fixture phase. */
export async function scheduleFixture(
  expectedVersion: number,
  matchId: string,
  scheduledAt: Date | null,
): Promise<void> {
  if (!validScheduledAt(scheduledAt)) {
    throw new FixtureActionError(
      "FIXTURE_SCHEDULE_TIME",
      "Enter a valid match date and time.",
    );
  }

  await withLockedCompetition(expectedVersion, async (tx, competition) => {
    const [match] = await tx
      .select({ id: fixtureMatches.id })
      .from(fixtureMatches)
      .where(
        and(
          eq(fixtureMatches.id, matchId),
          eq(fixtureMatches.competitionId, competition.id),
        ),
      )
      .limit(1);
    if (!match) {
      throw new FixtureActionError("FIXTURE_MATCH_NOT_FOUND", "That match could not be found.");
    }

    await tx
      .update(fixtureMatches)
      .set({ scheduledAt })
      .where(eq(fixtureMatches.id, match.id));
    await bumpCompetitionVersion(tx, competition);
  });
}

async function getMatchForUpdate(
  tx: FixtureTransaction,
  competitionId: number,
  matchId: string,
) {
  const [match] = await tx
    .select()
    .from(fixtureMatches)
    .where(
      and(
        eq(fixtureMatches.id, matchId),
        eq(fixtureMatches.competitionId, competitionId),
      ),
    )
    .for("update")
    .limit(1);
  if (!match) {
    throw new FixtureActionError("FIXTURE_MATCH_NOT_FOUND", "That match could not be found.");
  }
  return match;
}

/** Save one completed BO3 result and advance playoff participants when needed. */
export async function recordFixtureResult(
  expectedVersion: number,
  matchId: string,
  homeScore: number,
  awayScore: number,
): Promise<void> {
  if (!Number.isInteger(homeScore) || !Number.isInteger(awayScore) || !isValidSeriesScore(homeScore, awayScore)) {
    throw new FixtureActionError(
      "FIXTURE_SCORE",
      "A best-of-three result must be 2-0 or 2-1.",
    );
  }

  await withLockedCompetition(expectedVersion, async (tx, competition) => {
    const match = await getMatchForUpdate(tx, competition.id, matchId);
    if (match.homeTeamId === null || match.awayTeamId === null) {
      throw new FixtureActionError(
        "FIXTURE_MATCH_UNASSIGNED",
        "Both teams must be known before recording a result.",
      );
    }

    if (match.stage === "league") {
      phaseError(competition.phase, "league");
    } else if (match.stage === "semifinal") {
      phaseError(competition.phase, "playoffs");
      const [final] = await tx
        .select({ homeScore: fixtureMatches.homeScore, awayScore: fixtureMatches.awayScore })
        .from(fixtureMatches)
        .where(
          and(
            eq(fixtureMatches.competitionId, competition.id),
            eq(fixtureMatches.stage, "final"),
          ),
        )
        .for("update")
        .limit(1);
      if (final?.homeScore !== null || final?.awayScore !== null) {
        throw new FixtureActionError(
          "FIXTURE_FINAL_LOCKED",
          "Semifinal results cannot change after the final is complete.",
        );
      }
    } else {
      phaseError(competition.phase, ["playoffs", "complete"]);
    }

    await tx
      .update(fixtureMatches)
      .set({ homeScore, awayScore })
      .where(eq(fixtureMatches.id, match.id));

    if (match.stage === "semifinal") {
      const semifinalRows = await tx
        .select()
        .from(fixtureMatches)
        .where(
          and(
            eq(fixtureMatches.competitionId, competition.id),
            eq(fixtureMatches.stage, "semifinal"),
          ),
        )
        .orderBy(asc(fixtureMatches.position));
      const winners = semifinalRows.map((semifinal) =>
        semifinal.id === match.id
          ? homeScore > awayScore
            ? semifinal.homeTeamId
            : semifinal.awayTeamId
          : matchWinner(toFixtureMatch(semifinal)),
      );
      const [final] = await tx
        .select()
        .from(fixtureMatches)
        .where(
          and(
            eq(fixtureMatches.competitionId, competition.id),
            eq(fixtureMatches.stage, "final"),
          ),
        )
        .for("update")
        .limit(1);
      if (final) {
        await tx
          .update(fixtureMatches)
          .set({
            homeTeamId: winners[0] ?? null,
            awayTeamId: winners[1] ?? null,
          })
          .where(eq(fixtureMatches.id, final.id));
      }
    }

    await bumpCompetitionVersion(
      tx,
      competition,
      match.stage === "final" ? "complete" : competition.phase,
    );
  });
}

/** Seed the top four and open the playoff bracket after every league match is complete. */
export async function seedFixturePlayoffs(
  expectedVersion: number,
  orderedTeamIds: readonly string[],
): Promise<void> {
  await withLockedCompetition(expectedVersion, async (tx, competition) => {
    phaseError(competition.phase, "league");
    if (competition.playoffOrder !== null) {
      throw new FixtureActionError(
        "FIXTURE_PLAYOFFS_SEEDED",
        "Playoff seeding has already been set.",
      );
    }

    const { entries, matches } = await loadFixtureRows(tx, competition.id);
    const leagueMatches = matches.filter((match) => match.stage === "league");
    if (leagueMatches.some((match) => match.homeScore === null || match.awayScore === null)) {
      throw new FixtureActionError(
        "FIXTURE_LEAGUE_INCOMPLETE",
        "Complete every league match before seeding the playoffs.",
      );
    }
    if (!validatePlayoffOrder(calculateStandings(entries, matches), orderedTeamIds)) {
      throw new FixtureActionError(
        "FIXTURE_PLAYOFF_ORDER",
        "Playoff order must include every team and preserve unresolved tie groups.",
      );
    }

    const semifinalRows = await tx
      .select({ id: fixtureMatches.id, position: fixtureMatches.position })
      .from(fixtureMatches)
      .where(
        and(
          eq(fixtureMatches.competitionId, competition.id),
          eq(fixtureMatches.stage, "semifinal"),
        ),
      )
      .orderBy(asc(fixtureMatches.position))
      .for("update");
    const firstSemifinal = semifinalRows.find((match) => match.position === 1);
    const secondSemifinal = semifinalRows.find((match) => match.position === 2);
    if (!firstSemifinal || !secondSemifinal) {
      throw new FixtureActionError(
        "FIXTURES_INVALID",
        "The prepared fixture bracket is incomplete.",
      );
    }

    await tx
      .update(fixtureMatches)
      .set({ homeTeamId: orderedTeamIds[0], awayTeamId: orderedTeamIds[3] })
      .where(eq(fixtureMatches.id, firstSemifinal.id));
    await tx
      .update(fixtureMatches)
      .set({ homeTeamId: orderedTeamIds[1], awayTeamId: orderedTeamIds[2] })
      .where(eq(fixtureMatches.id, secondSemifinal.id));

    await tx
      .update(fixtureMatches)
      .set({ homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null })
      .where(
        and(
          eq(fixtureMatches.competitionId, competition.id),
          eq(fixtureMatches.stage, "final"),
        ),
      );

    await bumpCompetitionVersion(tx, competition, "playoffs", [...orderedTeamIds]);
  });
}

/** Discard an organizer's private draft schedule. */
export async function discardFixtureDraft(expectedVersion: number): Promise<void> {
  await withLockedCompetition(expectedVersion, async (tx, competition) => {
    phaseError(competition.phase, "draft");
    await tx.delete(fixtureMatches).where(eq(fixtureMatches.competitionId, competition.id));
    await tx.delete(fixtureEntries).where(eq(fixtureEntries.competitionId, competition.id));
    // Retain a monotonic revision so stale forms cannot target a new draft.
    await bumpCompetitionVersion(tx, competition, "draft", null);
  });
}
