import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getRegistrationForParticipant,
  getTeamForRegistration,
  getTeamDirectory,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function BrowseTeamsPage() {
  const { participant, shell } = await getRoomPageData("/tournament/teams");
  const registration = await getRegistrationForParticipant(participant.id);
  const [teams, team] = await Promise.all([
    getTeamDirectory(),
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      registration={registration}
      team={team}
      teams={teams}
      view="teams"
    />
  );
}
