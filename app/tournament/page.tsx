import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getParticipantDashboardData,
  getRegistrationForParticipant,
  getTeamForRegistration,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function TournamentPage() {
  const { participant, shell, userId } = await getRoomPageData("/tournament");
  const registration = await getRegistrationForParticipant(participant.id);
  const [team, dashboard] = await Promise.all([
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
    getParticipantDashboardData(userId),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      dashboard={dashboard}
      registration={registration}
      team={team}
      view="dashboard"
    />
  );
}
