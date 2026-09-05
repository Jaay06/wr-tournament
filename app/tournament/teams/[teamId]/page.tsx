import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getRegistrationForParticipant,
  getTeamDetails,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";
import { teamIdSchema } from "@/lib/validation";

export const metadata: Metadata = {
  title: "Team details",
};

export default async function TeamDetailsPage({
  params,
}: {
  params: Promise<{ teamId: string }>;
}) {
  const { teamId } = await params;

  if (!teamIdSchema.safeParse(teamId).success) {
    notFound();
  }

  const { participant, shell } = await getRoomPageData(
    `/tournament/teams/${teamId}`,
  );

  const [registration, teamDetails] = await Promise.all([
    getRegistrationForParticipant(participant.id),
    getTeamDetails(teamId),
  ]);

  if (!teamDetails) {
    notFound();
  }

  return (
    <TournamentAppClient
      {...shell}
      registration={registration}
      teamDetails={teamDetails}
      view="team-details"
    />
  );
}
