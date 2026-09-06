"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants } from "@/db/schema";
import {
  adjustDraftTimer,
  commitDraftPick,
  DraftActionError,
  pauseDraft,
  resumeDraft,
  startDraft,
  undoLatestDraftPick,
} from "@/lib/draft-data";
import { teamIdSchema } from "@/lib/validation";

export type DraftActionState = {
  code?: string;
  error?: string;
  success?: string;
  sessionId?: string;
  pickId?: string;
  remainingSeconds?: number;
};

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

function parseUuid(value: string | undefined) {
  const parsed = teamIdSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

function parseExpectedVersion(formData: FormData) {
  const value = formString(formData, "expectedVersion");
  if (!value) return undefined;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

function revalidateDraftPages() {
  revalidatePath("/tournament");
  revalidatePath("/tournament/team");
  revalidatePath("/tournament/teams");
  revalidatePath("/tournament/draft");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/admin/draft");
}

async function getParticipantAccess() {
  const session = await auth();
  if (!session?.user?.id) {
    return {
      error: "Sign in before using the draft room.",
      code: "UNAUTHENTICATED",
    } as const;
  }
  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);
  if (!participant) {
    return {
      error: "Join the tournament before entering the draft room.",
      code: "TOURNAMENT_ACCESS_REQUIRED",
    } as const;
  }
  return { userId: session.user.id, role: session.user.role } as const;
}

async function getOrganizerAccess() {
  const access = await getParticipantAccess();
  if ("error" in access) return access;
  if (access.role !== "organizer") {
    return {
      error: "Only the organizer can use draft controls.",
      code: "FORBIDDEN",
    } as const;
  }
  return access;
}

function actionError(error: unknown): DraftActionState {
  if (error instanceof DraftActionError) {
    return { code: error.code, error: error.message };
  }
  throw error;
}

export async function startCaptainDraft(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;

  const selectedTeamIds = formData
    .getAll("teamId")
    .flatMap((value) => (typeof value === "string" ? [parseUuid(value)] : []))
    .filter((id): id is string => Boolean(id));
  if (selectedTeamIds.length === 0) {
    return { code: "VALIDATION_ERROR", error: "Choose at least one captain-only team." };
  }

  try {
    const result = await startDraft({
      organizerId: access.userId,
      teamIds: selectedTeamIds,
    });
    revalidateDraftPages();
    return {
      success: `Draft started with ${result.teamCount} team${result.teamCount === 1 ? "" : "s"}.`,
      sessionId: result.sessionId,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function pickDraftPlayer(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getParticipantAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  const registrationId = parseUuid(formString(formData, "registrationId"));
  if (!sessionId || !registrationId) {
    return { code: "VALIDATION_ERROR", error: "Choose an available player." };
  }

  try {
    const result = await commitDraftPick({
      sessionId,
      userId: access.userId,
      registrationId,
      expectedVersion: parseExpectedVersion(formData),
      source: "captain",
      requestKey: formString(formData, "requestKey") ?? null,
    });
    revalidateDraftPages();
    return {
      success: result.replayed ? "Pick confirmed." : "Player picked.",
      pickId: result.pickId,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function organizerPickDraftPlayer(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  if (!sessionId) return { code: "VALIDATION_ERROR", error: "That draft could not be found." };
  const registrationId = formString(formData, "registrationId");
  if (registrationId && !parseUuid(registrationId)) {
    return { code: "VALIDATION_ERROR", error: "Choose a registered player." };
  }

  try {
    const result = await commitDraftPick({
      sessionId,
      userId: access.userId,
      registrationId: registrationId ? parseUuid(registrationId) : null,
      expectedVersion: parseExpectedVersion(formData),
      source: "organizer",
      requestKey: formString(formData, "requestKey") ?? null,
    });
    revalidateDraftPages();
    return {
      success: result.replayed ? "Pick confirmed." : "Pick recorded for the captain.",
      pickId: result.pickId,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function pauseCaptainDraft(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  if (!sessionId) return { code: "VALIDATION_ERROR", error: "That draft could not be found." };
  try {
    const result = await pauseDraft(sessionId);
    revalidateDraftPages();
    return { success: "Draft paused.", remainingSeconds: result.remainingSeconds };
  } catch (error) {
    return actionError(error);
  }
}

export async function resumeCaptainDraft(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  if (!sessionId) return { code: "VALIDATION_ERROR", error: "That draft could not be found." };
  try {
    const result = await resumeDraft(sessionId);
    revalidateDraftPages();
    return { success: "Draft resumed.", remainingSeconds: "remainingSeconds" in result ? result.remainingSeconds : undefined };
  } catch (error) {
    return actionError(error);
  }
}

export async function adjustCaptainDraftTimer(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  const rawDelta = Number.parseInt(formString(formData, "deltaSeconds") ?? "", 10);
  if (!sessionId || !Number.isInteger(rawDelta) || Math.abs(rawDelta) > 600) {
    return { code: "VALIDATION_ERROR", error: "Choose a timer adjustment between -600 and 600 seconds." };
  }
  try {
    const result = await adjustDraftTimer(sessionId, rawDelta);
    revalidateDraftPages();
    return {
      success: result.autoPicked ? "Time expired; an eligible player was picked." : "Timer updated.",
      remainingSeconds: result.remainingSeconds,
      pickId: "pickId" in result ? result.pickId : undefined,
    };
  } catch (error) {
    return actionError(error);
  }
}

export async function undoCaptainDraftPick(
  _previousState: DraftActionState,
  formData: FormData,
): Promise<DraftActionState> {
  void _previousState;
  const access = await getOrganizerAccess();
  if ("error" in access) return access;
  const sessionId = parseUuid(formString(formData, "sessionId"));
  if (!sessionId) return { code: "VALIDATION_ERROR", error: "That draft could not be found." };
  try {
    const result = await undoLatestDraftPick(sessionId);
    revalidateDraftPages();
    return { success: "Latest pick undone. The captain has a fresh 60 seconds.", pickId: result.pickId };
  } catch (error) {
    return actionError(error);
  }
}
