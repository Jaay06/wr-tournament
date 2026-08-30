import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import {
  getParticipantDirectory,
  getRegistrationForParticipant,
  getTeamForRegistration,
} from "@/lib/tournament-data";
import { formatDeadline } from "@/lib/tournament";

export default async function TeamBuilderPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Ftournament%2Fteam");
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
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
  const [team, participants] = await Promise.all([
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
    getParticipantDirectory(),
  ]);

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      region={settings.region}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      currentRegistrationId={registration?.id}
      participants={participants}
      team={team}
      view="builder"
    />
  );
}
