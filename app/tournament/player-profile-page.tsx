import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getRoomPageData } from "@/lib/room-page-data";
import { getRegistrationForParticipant } from "@/lib/tournament-data";

export async function PlayerProfilePage({
  view,
}: {
  view: "profile" | "registration";
}) {
  const path = view === "profile" ? "/tournament/profile" : "/tournament/register";
  const { participant, shell } = await getRoomPageData(path);
  const registration = await getRegistrationForParticipant(participant.id);

  return (
    <TournamentAppClient
      {...shell}
      registration={registration}
      view={view}
    />
  );
}
