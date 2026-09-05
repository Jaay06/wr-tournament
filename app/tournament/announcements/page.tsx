import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getRoomPageData } from "@/lib/room-page-data";
import { getAnnouncements, getRegistrationForParticipant, getTeamForRegistration } from "@/lib/tournament-data";

export default async function AnnouncementsPage() {
  const { participant, shell } = await getRoomPageData("/tournament/announcements");
  const [announcements, registration] = await Promise.all([
    getAnnouncements(), getRegistrationForParticipant(participant.id),
  ]);
  const team = registration ? await getTeamForRegistration(registration.id) : null;
  return <TournamentAppClient {...shell} view="announcements" announcements={announcements} registration={registration} team={team} />;
}
