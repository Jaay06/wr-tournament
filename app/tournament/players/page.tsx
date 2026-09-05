import type { Metadata } from "next";

import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getPlayerDirectory,
  getRegistrationForParticipant,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export const metadata: Metadata = {
  title: "Player directory",
};

export default async function PlayerDirectoryPage() {
  const { participant, shell } = await getRoomPageData("/tournament/players");
  const [registration, players] = await Promise.all([
    getRegistrationForParticipant(participant.id),
    getPlayerDirectory(),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      currentRegistrationId={registration?.id}
      players={players}
      registration={registration}
      view="players"
    />
  );
}
