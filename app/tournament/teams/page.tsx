import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { getTeamDirectory } from "@/lib/tournament-data";
import { formatDeadline } from "@/lib/tournament";

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

  const teams = await getTeamDirectory();

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      region={settings.region}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      teams={teams}
      view="teams"
    />
  );
}
