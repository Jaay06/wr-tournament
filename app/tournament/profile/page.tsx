import type { Metadata } from "next";

import { PlayerProfilePage } from "@/app/tournament/player-profile-page";

export const metadata: Metadata = {
  title: "Player profile",
};

export default function ProfilePage() {
  return <PlayerProfilePage view="profile" />;
}
