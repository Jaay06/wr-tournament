import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getPlayerProfile,
  getRegistrationForParticipant,
} from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";
import { teamIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Player details",
};

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;

  if (!teamIdSchema.safeParse(registrationId).success) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(`/tournament/players/${registrationId}`)}`,
    );
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (!participant) {
    redirect("/invite");
  }

  const [settings, currentRegistration, playerProfile] = await Promise.all([
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
    getPlayerProfile(registrationId),
  ]);

  if (!settings) {
    redirect("/invite");
  }

  if (!playerProfile) {
    notFound();
  }

  const deadlineState = formatDeadlineState(settings.registrationDeadline);

  return (
    <TournamentApp
      currentRegistrationId={currentRegistration?.id}
      deadline={formatDeadline(settings.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      playerProfile={playerProfile}
      region={settings.region}
      registration={currentRegistration}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      view="player-details"
    />
  );
}
