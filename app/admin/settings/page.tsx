import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getRoomPageData } from "@/lib/room-page-data";
import { toDateTimeLocalValue } from "@/lib/tournament";

export default async function OrganizerSettingsPage() {
  const { shell, settings } = await getRoomPageData("/admin/settings", true);
  return <TournamentAppClient {...shell} view="admin-settings" registration={null} settings={{
    name: settings.name,
    region: settings.region,
    inviteEnabled: settings.inviteEnabled,
    registrationDeadline: toDateTimeLocalValue(settings.registrationDeadline),
  }} />;
}
