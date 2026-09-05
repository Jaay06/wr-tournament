import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants, tournamentSettings } from "@/db/schema";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export async function getRoomPageData(path: string, organizer = false) {
  const session = await auth();
  if (!session?.user?.id) redirect(`/signin?callbackUrl=${encodeURIComponent(path)}`);
  if (organizer && session.user.role !== "organizer") redirect("/tournament");

  const [participant] = await db.select({ id: tournamentParticipants.id })
    .from(tournamentParticipants).where(eq(tournamentParticipants.userId, session.user.id)).limit(1);
  if (!participant) redirect("/invite");

  const [settings] = await db.select().from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1)).limit(1);
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
      showSignOut: true,
    },
  };
}
