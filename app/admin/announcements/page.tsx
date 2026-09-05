import { TournamentApp } from "@/components/tournament/tournament-app";
import { getRoomPageData } from "@/lib/room-page-data";
import { getAnnouncements } from "@/lib/tournament-data";

export default async function OrganizerAnnouncementsPage() {
  const { shell } = await getRoomPageData("/admin/announcements", true);
  const announcements = await getAnnouncements();
  return <TournamentApp {...shell} view="admin-announcements" announcements={announcements} registration={null} />;
}
