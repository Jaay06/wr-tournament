import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getRoomPageData } from "@/lib/room-page-data";
import { getAnnouncements, getOrganizerOverviewData } from "@/lib/tournament-data";

export default async function AdminPage() {
  const { shell } = await getRoomPageData("/admin", true);
  const [overview, announcements] = await Promise.all([getOrganizerOverviewData(), getAnnouncements()]);
  return <TournamentAppClient {...shell} announcements={announcements} overview={overview} registration={null} view="admin" />;
}
