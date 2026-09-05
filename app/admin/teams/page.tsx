import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getAllTeamDetails,
  getParticipantDirectory,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function AdminTeamsPage() {
  const { shell } = await getRoomPageData("/admin/teams", true);
  const [teams, participants] = await Promise.all([
    getAllTeamDetails(),
    getParticipantDirectory(),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      adminTeams={teams}
      participants={participants}
      view="admin-teams"
    />
  );
}
