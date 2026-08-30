import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import { formatDeadline } from "@/lib/tournament";

export default async function TierReviewPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin%2Ftier-review");
  }

  if (session.user.role !== "organizer") {
    redirect("/tournament");
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

  return (
    <TournamentApp
      deadline={formatDeadline(settings?.registrationDeadline)}
      region={settings?.region}
      showSignOut
      tournamentName={settings?.name}
      userName={session.user.name ?? "organizer"}
      view="tier-review"
    />
  );
}
