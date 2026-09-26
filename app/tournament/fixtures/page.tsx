import { TournamentAppClient } from '@/components/tournament/tournament-app-client';
import { getFixtureBoard } from '@/lib/fixture-data';
import { getRoomPageData } from '@/lib/room-page-data';
import { getRegistrationForParticipant } from '@/lib/tournament-data';

export default async function FixturesPage() {
  const { participant, shell } = await getRoomPageData('/tournament/fixtures');
  const [fixtures, registration] = await Promise.all([
    getFixtureBoard(),
    getRegistrationForParticipant(participant.id),
  ]);

  return <TournamentAppClient {...shell} fixtures={fixtures} registration={registration} view='fixtures' />;
}
