import type { Metadata } from "next";
import { eq } from "drizzle-orm";
import { notFound, redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getRegistrationForParticipant,
  getTeamDetails,
} from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";
import { teamIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Team details",
};

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  if (!teamIdSchema.safeParse(teamId).success) {
    notFound();
  }

  const session = await auth();

  if (!session?.user?.id) {
    redirect(
      `/signin?callbackUrl=${encodeURIComponent(`/tournament/teams/${teamId}`)}`,
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

  const [settings, registration, teamDetails] = await Promise.all([
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
    getTeamDetails(teamId),
  ]);

  if (!settings) {
    redirect("/invite");
  }

  if (!teamDetails) {
    notFound();
  }

  const deadlineState = formatDeadlineState(settings.registrationDeadline);

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      region={settings.region}
      registration={registration}
      showSignOut
      teamDetails={teamDetails}
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      view="team-details"
    />
  );
}
