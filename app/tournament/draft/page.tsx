import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getDraftBoardData } from "@/lib/draft-data";
import {
  getRegistrationForParticipant,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function DraftRoomPage() {
  const { participant, shell, userId } = await getRoomPageData("/tournament/draft");
  const [registration, draft] = await Promise.all([
    getRegistrationForParticipant(participant.id),
    getDraftBoardData(userId),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      draft={draft}
      registration={registration}
      view="draft"
    />
  );
}
