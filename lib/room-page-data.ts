import { and, eq, isNull } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  tournamentParticipants,
  tournamentSettings,
  users,
} from "@/db/schema";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export async function getRoomPageData(path: string, organizer = false) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  if (organizer && session.user.role !== "organizer") redirect("/tournament");

  const [[participant], [settings]] = await Promise.all([
    db
      .select({ id: tournamentParticipants.id })
      .from(tournamentParticipants)
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(
        and(
          eq(tournamentParticipants.userId, session.user.id),
          isNull(users.deletedAt),
        ),
      )
      .limit(1),
    db
      .select()
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .limit(1),
  ]);

  if (!participant) redirect("/invite");
  if (!settings) redirect("/invite");
  const deadlineState = formatDeadlineState(settings.registrationDeadline);

  return {
    participant,
    settings,
    userId: session.user.id,
    shell: {
      userName: session.user.name ?? (organizer ? "organizer" : "player"),
      tournamentName: settings.name,
      region: settings.region,
      deadline: formatDeadline(settings.registrationDeadline),
      deadlineRemaining: deadlineState.compactLabel,
      deadlineStatus: deadlineState.status,
      teamRegistrationEnabled: settings.teamRegistrationEnabled,
      showSignOut: true,
    },
  };
}
