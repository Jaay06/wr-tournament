import { TournamentAppClient } from "@/components/tournament/tournament-app-client";
import {
  getParticipantDirectory,
  getPendingTeamInvitesForRegistration,
  getRegistrationForParticipant,
  getTeamForRegistration,
} from "@/lib/tournament-data";
import { getRoomPageData } from "@/lib/room-page-data";

export default async function TeamBuilderPage() {
  const { participant, shell } = await getRoomPageData("/tournament/team");
  const registration = await getRegistrationForParticipant(participant.id);
  const [team, participants, incomingInvites] = await Promise.all([
    registration ? getTeamForRegistration(registration.id) : Promise.resolve(null),
    getParticipantDirectory(),
    registration
      ? getPendingTeamInvitesForRegistration(registration.id)
      : Promise.resolve([]),
  ]);

  return (
    <TournamentAppClient
      {...shell}
      currentRegistrationId={registration?.id}
      incomingInvites={incomingInvites}
      participants={participants}
      registration={registration}
      team={team}
      view={team?.status === "submitted" ? "submitted" : "builder"}
    />
  );
}
