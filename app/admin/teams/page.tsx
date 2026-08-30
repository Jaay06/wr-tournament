import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import {
  getAllTeamDetails,
  getParticipantDirectory,
} from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export default async function AdminTeamsPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin%2Fteams");
  }

  if (session.user.role !== "organizer") {
    redirect("/tournament");
  }

  if (!session.user.hasJoinedTournament) {
    redirect("/invite");
  }

  const [settings, teams, participants] = await Promise.all([
    db
      .select({
        name: tournamentSettings.name,
        region: tournamentSettings.region,
        registrationDeadline: tournamentSettings.registrationDeadline,
      })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .limit(1)
      .then(([row]) => row),
    getAllTeamDetails(),
    getParticipantDirectory(),
  ]);
  const deadlineState = formatDeadlineState(settings?.registrationDeadline);

  return (
    <TournamentApp
      adminTeams={teams}
      deadline={formatDeadline(settings?.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      participants={participants}
      region={settings?.region}
      showSignOut
      tournamentName={settings?.name}
      userName={session.user.name ?? "organizer"}
      view="admin-teams"
    />
  );
}
