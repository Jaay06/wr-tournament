import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { TournamentApp } from "@/components/tournament/tournament-app";
import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import { getTierReview } from "@/lib/tournament-data";
import { formatDeadline, formatDeadlineState } from "@/lib/tournament";

export default async function TierReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string | string[] }>;
}) {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/signin?callbackUrl=%2Fadmin%2Ftier-review");
  }

  if (session.user.role !== "organizer") {
    redirect("/tournament");
  }

  if (!session.user.hasJoinedTournament) {
    redirect("/invite");
  }

  const params = await searchParams;
  const registrationId = Array.isArray(params.registration)
    ? params.registration[0]
    : params.registration;
  const review = await getTierReview(registrationId);

  if (registrationId && review?.id !== registrationId) {
    redirect(
      review
        ? `/admin/tier-review?registration=${encodeURIComponent(review.id)}`
        : "/admin/tier-review",
    );
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
  const deadlineState = formatDeadlineState(settings?.registrationDeadline);

  return (
    <TournamentApp
      deadline={formatDeadline(settings?.registrationDeadline)}
      deadlineRemaining={deadlineState.compactLabel}
      deadlineStatus={deadlineState.status}
      region={settings?.region}
      showSignOut
      tierReview={review}
      tournamentName={settings?.name}
      userName={session.user.name ?? "organizer"}
      view="tier-review"
    />
  );
}
