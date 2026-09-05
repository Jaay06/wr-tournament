"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth, updateSession } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { hashInviteCode, inviteCodesMatch } from "@/lib/tournament";
import { inviteCodeSchema } from "@/lib/validation";

export type InviteState = {
  error?: string;
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function joinTournament(
  _previousState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before entering the tournament." };
  }

  const parsed = inviteCodeSchema.safeParse({
    code: formData.get("code"),
  });

  if (!parsed.success) {
    return { error: "Enter the invite code from the organizer." };
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

  if (!inviteCodesMatch(hashInviteCode(parsed.data.code.toUpperCase()), settings.inviteCodeHash)) {
    return { error: "That invite code is not valid." };
  }

  const [existingParticipant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (existingParticipant) {
    await updateSession({ user: { hasJoinedTournament: true } });
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

  await updateSession({ user: { hasJoinedTournament: true } });
  redirect("/tournament/register");
}
