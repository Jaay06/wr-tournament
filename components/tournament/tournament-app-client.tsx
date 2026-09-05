"use client";

import dynamic from "next/dynamic";
import type { TournamentAppProps } from "./tournament-app";

import { RoomLoading } from "./room-loading";

const TournamentApp = dynamic<TournamentAppProps>(
  () =>
    import("./tournament-app").then(({ TournamentApp: Component }) => Component),
  {
    loading: () => <RoomLoading />,
    ssr: false,
  },
);

export function TournamentAppClient(props: TournamentAppProps) {
  return <TournamentApp {...props} />;
}
