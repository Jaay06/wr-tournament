import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { redirect } from "next/navigation";
import { getTierReview } from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function TierReviewPage({
  searchParams,
}: {
  searchParams: Promise<{ registration?: string | string[] }>;
}) {
  const { shell } = await getRoomPageData("/admin/tier-review", true);

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

  return (
    <TournamentAppClient
      {...shell}
      showSignOut
      tierReview={review}
      view="tier-review"
    />
  );
}
