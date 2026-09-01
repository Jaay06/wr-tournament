import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";
import { getRegistrationForParticipant } from "@/lib/tournament-data";

export async function PlayerProfilePage({
  view,
}: {
  view: "profile" | "registration";
}) {
  const session = await auth();
  const callbackUrl =
    view === "profile" ? "%2Ftournament%2Fprofile" : "%2Ftournament%2Fregister";

  if (!session?.user?.id) {
    redirect(`/signin?callbackUrl=${callbackUrl}`);
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

  const deadlineState = formatDeadlineState(settings.registrationDeadline);
  const registration = await getRegistrationForParticipant(participant.id);

  return (
    <TournamentApp
      deadline={formatDeadline(settings.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      region={settings.region}
      registration={registration}
      showSignOut
      tournamentName={settings.name}
      userName={session.user.name ?? "player"}
      view={view}
    />
  );
}
