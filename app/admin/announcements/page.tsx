import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getRoomPageData } from "@/lib/room-page-data";
import { getAnnouncements } from "@/lib/tournament-data";

export default async function OrganizerAnnouncementsPage() {
  const { shell } = await getRoomPageData("/admin/announcements", true);
  const announcements = await getAnnouncements();
  return <TournamentAppClient {...shell} view="admin-announcements" announcements={announcements} registration={null} />;
}
