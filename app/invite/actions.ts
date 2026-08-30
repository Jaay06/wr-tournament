"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { hashInviteCode, inviteCodesMatch } from "@/lib/tournament";
import { inviteCodeSchema } from "@/lib/validation";

export type InviteState = {
  error?: string;
};

type InviteAttemptWindow = {
  failedAttempts: number;
  startedAt: number;
};

const inviteAttemptLimit = 5;
const inviteAttemptWindowMs = 15 * 60 * 1000;
const globalForInviteAttempts = globalThis as typeof globalThis & {
  inviteAttemptWindows?: Map<string, InviteAttemptWindow>;
};
const inviteAttemptWindows =
  globalForInviteAttempts.inviteAttemptWindows ??
  new Map<string, InviteAttemptWindow>();

globalForInviteAttempts.inviteAttemptWindows = inviteAttemptWindows;

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function inviteAttemptWaitMinutes(userId: string) {
  const attemptWindow = inviteAttemptWindows.get(userId);
  if (!attemptWindow) {
    return null;
  }

  const expiresAt = attemptWindow.startedAt + inviteAttemptWindowMs;
  if (expiresAt <= Date.now()) {
    inviteAttemptWindows.delete(userId);
    return null;
  }

  if (attemptWindow.failedAttempts < inviteAttemptLimit) {
    return null;
  }

  return Math.max(1, Math.ceil((expiresAt - Date.now()) / 60_000));
}

function recordFailedInviteAttempt(userId: string) {
  const current = inviteAttemptWindows.get(userId);
  const now = Date.now();

  if (!current || current.startedAt + inviteAttemptWindowMs <= now) {
    inviteAttemptWindows.set(userId, { failedAttempts: 1, startedAt: now });
    return;
  }

  current.failedAttempts += 1;
}

export async function joinTournament(
  _previousState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before entering the tournament." };
  }

  const waitMinutes = inviteAttemptWaitMinutes(session.user.id);
  if (waitMinutes) {
    return {
      error: `Too many incorrect codes. Try again in ${waitMinutes} minute${waitMinutes === 1 ? "" : "s"}.`,
    };
  }

  const parsed = inviteCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    recordFailedInviteAttempt(session.user.id);
    return { error: "Enter the 4-digit invite code from the organizer." };
  }

  const [settings] = await db
    .select({
      inviteCodeHash: tournamentSettings.inviteCodeHash,
      inviteEnabled: tournamentSettings.inviteEnabled,
    })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return { error: "The tournament has not been set up yet." };
  }

  if (!settings.inviteEnabled) {
    return { error: "The organizer has closed the invite for now." };
  }

  if (!inviteCodesMatch(hashInviteCode(parsed.data.code), settings.inviteCodeHash)) {
    recordFailedInviteAttempt(session.user.id);
    return { error: "That invite code is not valid." };
  }

  inviteAttemptWindows.delete(session.user.id);

  const [existingParticipant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (existingParticipant) {
    redirect("/tournament");
  }

  try {
    await db.insert(tournamentParticipants).values({
      userId: session.user.id,
    });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  redirect("/tournament/register");
}
