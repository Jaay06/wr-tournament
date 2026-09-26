"use server";

import { revalidatePath } from "next/cache";
import { and, eq, isNull } from "drizzle-orm";
import { z } from "zod";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  tournamentParticipants,
  users,
} from "@/db/schema";
import {
  discardFixtureDraft,
  FixtureActionError,
  prepareFixtures,
  publishFixtures,
  recordFixtureResult,
  scheduleFixture,
  seedFixturePlayoffs,
} from "@/lib/fixture-data";
import type { FixtureActionState } from "@/lib/fixture-types";

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value.trim() : "";
}

function formStrings(formData: FormData, name: string) {
  return formData
    .getAll(name)
    .map((value) => typeof value === "string" ? value.trim() : "");
}

function formInteger(formData: FormData, name: string) {
  const value = formString(formData, name);
  if (!/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function requireOrganizer() {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in before using fixture controls." } as const;
  }

  const [organizer] = await db
    .select({ id: users.id })
    .from(users)
    .innerJoin(tournamentParticipants, eq(tournamentParticipants.userId, users.id))
    .where(
      and(
        eq(users.id, session.user.id),
        eq(users.role, "organizer"),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);

  if (!organizer) {
    return { error: "Only an active tournament organizer can use fixture controls." } as const;
  }

  return { organizer } as const;
}

function failure(error: unknown): FixtureActionState {
  if (error instanceof FixtureActionError) return { error: error.message };
  return { error: "We couldn't save that fixture change. Try again." };
}

function revalidateFixtures() {
  revalidatePath("/tournament/fixtures");
  revalidatePath("/admin/fixtures");
}

export async function prepareFixtureSchedule(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const teamIds = formStrings(formData, "teamId");
  if (teamIds.length < 4 || !z.array(z.uuid()).safeParse(teamIds).success) {
    return { error: "Select at least four teams before preparing fixtures." };
  }

  try {
    await prepareFixtures(teamIds);
    revalidateFixtures();
    return { success: "Fixture schedule prepared." };
  } catch (error) {
    return failure(error);
  }
}

export async function publishFixtureSchedule(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const version = formInteger(formData, "version");
  if (version === null) return { error: "Refresh the fixture schedule and try again." };

  try {
    await publishFixtures(version);
    revalidateFixtures();
    return { success: "Fixtures are now open for league results." };
  } catch (error) {
    return failure(error);
  }
}

export async function saveFixtureResult(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const version = formInteger(formData, "version");
  const homeScore = formInteger(formData, "homeScore");
  const awayScore = formInteger(formData, "awayScore");
  const matchId = formString(formData, "matchId");
  if (
    version === null ||
    homeScore === null ||
    awayScore === null ||
    !z.uuid().safeParse(matchId).success
  ) {
    return { error: "Enter both series scores and refresh before saving." };
  }

  try {
    await recordFixtureResult(version, matchId, homeScore, awayScore);
    revalidateFixtures();
    return { success: "Match result saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function saveFixtureSchedule(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const version = formInteger(formData, "version");
  const matchId = formString(formData, "matchId");
  const scheduledAtValue = formString(formData, "scheduledAt");
  if (version === null || !z.uuid().safeParse(matchId).success) {
    return { error: "Refresh the fixture schedule and try again." };
  }

  // The form explicitly labels datetime-local inputs as UTC.
  const isoTime = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(scheduledAtValue)
    ? `${scheduledAtValue}:00Z` : scheduledAtValue;
  if (isoTime && !z.iso.datetime({ offset: true }).safeParse(isoTime).success) {
    return { error: "Enter a valid match date and time in UTC." };
  }
  const scheduledAt = isoTime ? new Date(isoTime) : null;

  try {
    await scheduleFixture(version, matchId, scheduledAt);
    revalidateFixtures();
    return { success: "Match time saved." };
  } catch (error) {
    return failure(error);
  }
}

export async function seedFixtureFinals(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const version = formInteger(formData, "version");
  const orderedTeamIds = formStrings(formData, "orderedTeamId");
  if (version === null || orderedTeamIds.length < 4 || !z.array(z.uuid()).safeParse(orderedTeamIds).success) {
    return { error: "Choose a complete playoff order and refresh before saving." };
  }

  try {
    await seedFixturePlayoffs(version, orderedTeamIds);
    revalidateFixtures();
    return { success: "Playoff bracket seeded." };
  } catch (error) {
    return failure(error);
  }
}

export async function discardFixtureSchedule(
  _previousState: FixtureActionState,
  formData: FormData,
): Promise<FixtureActionState> {
  const access = await requireOrganizer();
  if ("error" in access) return access;

  const version = formInteger(formData, "version");
  if (version === null) return { error: "Refresh the fixture schedule and try again." };

  try {
    await discardFixtureDraft(version);
    revalidateFixtures();
    return { success: "Fixture draft discarded." };
  } catch (error) {
    return failure(error);
  }
}
