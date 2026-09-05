import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getPlayerProfile,
  getRegistrationForParticipant,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";
import { teamIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Player details",
};

export default async function PlayerDetailsPage({
  params,
}: {
  params: Promise<{ registrationId: string }>;
}) {
  const { registrationId } = await params;

  if (!teamIdSchema.safeParse(registrationId).success) {
    notFound();
  }

  const { participant, shell } = await getRoomPageData(
    `/tournament/players/${registrationId}`,
  );

  const [currentRegistration, playerProfile] = await Promise.all([
    getRegistrationForParticipant(participant.id),
    getPlayerProfile(registrationId),
  ]);

  if (!playerProfile) {
    notFound();
  }

  return (
    <TournamentAppClient
      {...shell}
      currentRegistrationId={currentRegistration?.id}
      playerProfile={playerProfile}
      registration={currentRegistration}
      view="player-details"
    />
  );
}
