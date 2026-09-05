import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { hashInviteCode, inviteCodesMatch } from "@/lib/tournament";
import { inviteCodeSchema } from "@/lib/validation";

export type JoinTournamentFailureCode =
  | "INVITE_INVALID"
  | "INVITE_CLOSED"
  | "TOURNAMENT_NOT_CONFIGURED";

export type JoinTournamentResult =
  | {
      ok: true;
      redirectTo: "/tournament" | "/tournament/register";
    }
  | {
      ok: false;
      code: JoinTournamentFailureCode;
      error: string;
      status: 400 | 403 | 503;
    };

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function joinTournamentForUser(
  userId: string,
  rawCode: unknown,
): Promise<JoinTournamentResult> {
  const parsed = inviteCodeSchema.safeParse({ code: rawCode });

  if (!parsed.success) {
    return {
      ok: false,
      code: "INVITE_INVALID",
      error: "Enter the invite code from the organizer.",
      status: 400,
    };
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
    return {
      ok: false,
      code: "TOURNAMENT_NOT_CONFIGURED",
      error: "The tournament has not been set up yet.",
      status: 503,
    };
  }

  if (!settings.inviteEnabled) {
    return {
      ok: false,
      code: "INVITE_CLOSED",
      error: "The organizer has closed the invite for now.",
      status: 403,
    };
  }

  if (
    !inviteCodesMatch(
      hashInviteCode(parsed.data.code.toUpperCase()),
      settings.inviteCodeHash,
    )
  ) {
    return {
      ok: false,
      code: "INVITE_INVALID",
      error: "That invite code is not valid.",
      status: 400,
    };
  }

  const [existingParticipant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, userId))
    .limit(1);

  if (existingParticipant) {
    return { ok: true, redirectTo: "/tournament" };
  }

  try {
    await db.insert(tournamentParticipants).values({ userId });
  } catch (error) {
    if (!isUniqueViolation(error)) {
      throw error;
    }
  }

  return { ok: true, redirectTo: "/tournament/register" };
}
