import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getDraftBoardData, getDraftSetupData } from "@/lib/draft-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function AdminDraftPage() {
  const { shell, userId } = await getRoomPageData("/admin/draft", true);
  const [draft, draftSetupTeams] = await Promise.all([
    getDraftBoardData(userId, { isOrganizer: true }),
    getDraftSetupData(),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      draft={draft}
      draftSetupTeams={draftSetupTeams}
      registration={null}
      view="admin-draft"
    />
  );
}
