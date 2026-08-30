import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getRegistrationForParticipant,
  getTeamForRegistration,
  getTeamDirectory,
} from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export default async function BrowseTeamsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament%2Fteams");
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (!participant) {
    redirect("/invite");
  }

  const registration = await getRegistrationForParticipant(participant.id);

  const [settings] = await db
    .select({
      name: tournamentSettings.name,
      region: tournamentSettings.region,
      registrationDeadline: tournamentSettings.registrationDeadline,
    })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    redirect("/invite");
  }

  const deadlineState = formatDeadlineState(settings.registrationDeadline);

  const [teams, team] = await Promise.all([
    getTeamDirectory(),
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
  ]);

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      region={settings.region}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      registration={registration}
      team={team}
      teams={teams}
      view="teams"
    />
  );
}
