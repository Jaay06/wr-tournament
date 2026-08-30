import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getParticipantDashboardData,
  getRegistrationForParticipant,
  getTeamForRegistration,
} from "@/lib/tournament-data";
import { formatDeadline } from "@/lib/tournament";

export default async function TournamentPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament");
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id, joinedAt: tournamentParticipants.joinedAt })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);

  if (!participant) {
    redirect("/invite");
  }

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

  const registration = await getRegistrationForParticipant(participant.id);
  const [team, dashboard] = await Promise.all([
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
    getParticipantDashboardData(session.user.id),
  ]);

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      region={settings.region}
      showSignOut
      dashboard={dashboard}
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      registration={registration}
      team={team}
      view="dashboard"
    />
  );
}
