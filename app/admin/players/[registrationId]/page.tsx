import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getPlayerProfile } from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";
import { teamIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Player details",
};

export default async function AdminPlayerDetailsPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;

  if (!teamIdSchema.safeParse(registrationId).success) {
    notFound();
  }

  const { shell } = await getRoomPageData(
    `/admin/players/${registrationId}`,
    true,
  );

  const playerProfile = await getPlayerProfile(registrationId);

  if (!playerProfile) {
    notFound();
  }

  return (
    <TournamentAppClient
      {...shell}
      playerProfile={playerProfile}
      view="admin-player-details"
    />
  );
}
