import type { Metadata } from "next";

import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import { getPlayerDirectory } from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export const metadata: Metadata = {
  title: "Player directory",
};

export default async function AdminPlayerDirectoryPage() {
  const { shell } = await getRoomPageData("/admin/players", true);
  const players = await getPlayerDirectory();

  return (
    <TournamentAppClient
      {...shell}
      players={players}
      view="admin-players"
    />
  );
}
