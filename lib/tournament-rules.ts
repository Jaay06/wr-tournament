import type {
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentRole,
  TournamentTier,
} from "./tournament-types";

export const starterRoles = [
  "Baron",
  "Jungle",
  "Mid",
  "Dragon",
  "Support",
] as const satisfies readonly TournamentRole[];

export type RosterValidation = {
  valid: boolean;
  blockingIssues: string[];
  warnings: string[];
  tierCounts: Record<TournamentTier, number>;
};

export function shouldReopenSubmittedTeam(
  teamStatus: "draft" | "submitted",
  validation: Pick<RosterValidation, "valid">,
) {
  return teamStatus === "submitted" && !validation.valid;
}

export function roleMatchesPreferences(
  assignedRole: TournamentRole,
  primaryRole: TournamentRole,
  secondaryRole: TournamentRole,
) {
  return assignedRole === primaryRole || assignedRole === secondaryRole;
}

export function availableTournamentParticipants(
  participants: TournamentParticipantOption[],
  memberRegistrationIds: Iterable<string> = [],
  pendingInviteRegistrationIds: Iterable<string> = [],
) {
  const members = new Set(memberRegistrationIds);
  const pendingInvites = new Set(pendingInviteRegistrationIds);

  return participants.filter(
    (participant) =>
      participant.teamId === null &&
      !members.has(participant.id) &&
      !pendingInvites.has(participant.id),
  );
}

export function validateRoster(
  members: Pick<
    TournamentMemberData,
    | "displayName"
    | "approvedTier"
    | "lineupPosition"
    | "starterRole"
    | "primaryRole"
    | "secondaryRole"
  >[],
): RosterValidation {
  const blockingIssues: string[] = [];
  const warnings: string[] = [];
  const starters = members.filter((member) => member.lineupPosition === "starter");
  const substitutes = members.filter(
    (member) => member.lineupPosition === "substitute",
  );
  const tierCounts: Record<TournamentTier, number> = {
    T1: 0,
    T2: 0,
    T3: 0,
    T4: 0,
  };

  if (members.length > 7) {
    blockingIssues.push("A team can have no more than seven members.");
  }

  if (starters.length !== 5) {
    blockingIssues.push(
      starters.length < 5
        ? `Add ${5 - starters.length} more starter${5 - starters.length === 1 ? "" : "s"}.`
        : "A team can have exactly five starters.",
    );
  }

  if (substitutes.length > 2) {
    blockingIssues.push("A team can have no more than two substitutes.");
  }

  const assignedRoles = new Set<TournamentRole>();
  for (const member of starters) {
    if (!member.starterRole) {
      blockingIssues.push(`${member.displayName} needs a starter role.`);
      continue;
    }

    if (assignedRoles.has(member.starterRole)) {
      blockingIssues.push(`The ${member.starterRole} starter slot is duplicated.`);
    }
    assignedRoles.add(member.starterRole);

    if (
      !roleMatchesPreferences(
        member.starterRole,
        member.primaryRole,
        member.secondaryRole,
      )
    ) {
      warnings.push(
        `${member.displayName} prefers ${member.primaryRole} or ${member.secondaryRole}, not ${member.starterRole}.`,
      );
    }
  }

  for (const role of starterRoles) {
    if (!assignedRoles.has(role)) {
      blockingIssues.push(`Assign a player to the ${role} starter slot.`);
    }
  }

  for (const member of members) {
    if (!member.approvedTier) {
      blockingIssues.push(`${member.displayName}'s tier still needs organizer approval.`);
      continue;
    }
    tierCounts[member.approvedTier] += 1;
  }

  if (tierCounts.T1 > 1) {
    blockingIssues.push(
      `This roster has ${tierCounts.T1} T1 players; the maximum is one.`,
    );
  }

  if (tierCounts.T2 > 2) {
    blockingIssues.push(
      `This roster has ${tierCounts.T2} T2 players; the maximum is two.`,
    );
  }

  return {
    valid: blockingIssues.length === 0,
    blockingIssues: [...new Set(blockingIssues)],
    warnings: [...new Set(warnings)],
    tierCounts,
  };
}
