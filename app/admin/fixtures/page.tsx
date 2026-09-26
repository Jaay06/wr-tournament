import { TournamentAppClient } from '@/components/tournament/tournament-app-client';
import { getFixtureBoard, getFixtureTeamOptions } from '@/lib/fixture-data';
import { getRoomPageData } from '@/lib/room-page-data';

export default async function AdminFixturesPage() {
  const { shell } = await getRoomPageData('/admin/fixtures', true);
  const [fixtures, fixtureTeams] = await Promise.all([
    getFixtureBoard(true),
    getFixtureTeamOptions(),
  ]);

  return <TournamentAppClient {...shell} fixtures={fixtures} fixtureTeams={fixtureTeams} registration={null} view='admin-fixtures' />;
}
