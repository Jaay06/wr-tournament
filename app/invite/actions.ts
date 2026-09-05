"use server";

import { redirect } from "next/navigation";

import { auth, updateSession } from "@/auth";
import { joinTournamentForUser } from "@/lib/join-tournament";

export type InviteState = {
  error?: string;
};

async function refreshTournamentSession() {
  try {
    await updateSession({ user: { hasJoinedTournament: true } });
  } catch {
    // Tournament access is checked from the participant row on every route.
  }
}

export async function joinTournament(
  _previousState: InviteState,
  formData: FormData,
): Promise<InviteState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before entering the tournament." };
  }

  const result = await joinTournamentForUser(
    session.user.id,
    formData.get("code"),
  );

  if (!result.ok) {
    return { error: result.error };
  }

  await refreshTournamentSession();
  redirect(result.redirectTo);
}
