import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getPlayerDirectory,
  getRegistrationForParticipant,
} from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export const metadata: Metadata = {
  title: "Player directory",
};

export default async function PlayerDirectoryPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament%2Fplayers");
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (!participant) {
    redirect("/invite");
  }

  const [settings, registration, players] = await Promise.all([
    db
      .select({
        name: tournamentSettings.name,
        region: tournamentSettings.region,
        registrationDeadline: tournamentSettings.registrationDeadline,
      })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .limit(1)
      .then(([value]) => value),
    getRegistrationForParticipant(participant.id),
    getPlayerDirectory(),
  ]);

  if (!settings) {
    redirect("/invite");
  }

  const deadlineState = formatDeadlineState(settings.registrationDeadline);

  return (
    <TournamentApp
      currentRegistrationId={registration?.id}
      deadline={formatDeadline(settings.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      players={players}
      region={settings.region}
      registration={registration}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      view="players"
    />
  );
}
