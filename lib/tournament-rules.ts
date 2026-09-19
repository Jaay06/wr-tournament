import { MIN_DRAFT_TEAM_SIZE } from "./draft-setup";

import type {
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentRole,
  TournamentTier,
} from "./tournament-types";

// With floor(playerCount / 6) teams, the largest possible roster has 11 players.
export const MAX_TEAM_MEMBERS = 2 * MIN_DRAFT_TEAM_SIZE - 1;

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

export type LineupAssignment = Pick<
  TournamentMemberData,
  "registrationId" | "lineupPosition" | "starterRole"
>;

export type LineupDropTarget =
  | { kind: "starter"; role: TournamentRole }
  | { kind: "substitute" }
  | { kind: "player"; registrationId: string };

export function participantTeamExitMode({
  isCaptain,
  memberCount,
}: {
  isCaptain: boolean;
  memberCount: number;
}): "leave" | "delete" | "transfer" {
  if (!isCaptain) return "leave";
  return memberCount === 1 ? "delete" : "transfer";
}

export function reconcileLineupAssignments(
  current: LineupAssignment[],
  members: LineupAssignment[],
): LineupAssignment[] {
  const currentByRegistrationId = new Map(
    current.map((assignment) => [assignment.registrationId, assignment]),
  );
  const next = members.map(
    (member) =>
      currentByRegistrationId.get(member.registrationId) ?? {
        registrationId: member.registrationId,
        lineupPosition: member.lineupPosition,
        starterRole: member.starterRole,
      },
  );

  return next.length === current.length &&
    next.every((assignment, index) => assignment === current[index])
    ? current
    : next;
}

export function arrangeLineupAssignments(
  assignments: LineupAssignment[],
  registrationId: string,
  target: LineupDropTarget,
): LineupAssignment[] {
  const sourceIndex = assignments.findIndex(
    (assignment) => assignment.registrationId === registrationId,
  );
  if (sourceIndex === -1) return assignments;

  const source = assignments[sourceIndex];
  let targetIndex = -1;
  let destination: Pick<
    LineupAssignment,
    "lineupPosition" | "starterRole"
  >;

  if (target.kind === "player") {
    targetIndex = assignments.findIndex(
      (assignment) => assignment.registrationId === target.registrationId,
    );
    if (targetIndex === -1 || targetIndex === sourceIndex) return assignments;
    destination = {
      lineupPosition: assignments[targetIndex].lineupPosition,
      starterRole: assignments[targetIndex].starterRole,
    };
  } else if (target.kind === "starter") {
    targetIndex = assignments.findIndex(
      (assignment) =>
        assignment.lineupPosition === "starter" &&
        assignment.starterRole === target.role,
    );
    if (targetIndex === sourceIndex) return assignments;
    destination = { lineupPosition: "starter", starterRole: target.role };
  } else {
    if (source.lineupPosition === "substitute") return assignments;
    destination = { lineupPosition: "substitute", starterRole: null };
  }

  const next = assignments.map((assignment, index) => {
    if (index === sourceIndex) {
      return { ...assignment, ...destination };
    }
    if (index === targetIndex) {
      return {
        ...assignment,
        lineupPosition: source.lineupPosition,
        starterRole: source.starterRole,
      };
    }
    return assignment;
  });

  return next.every(
    (assignment, index) =>
      assignment.lineupPosition === assignments[index].lineupPosition &&
      assignment.starterRole === assignments[index].starterRole,
  )
    ? assignments
    : next;
}

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
  const tierCounts: Record<TournamentTier, number> = {
    T1: 0,
    T2: 0,
    T3: 0,
    T4: 0,
  };

  if (members.length > MAX_TEAM_MEMBERS) {
    blockingIssues.push(`A team can have no more than ${MAX_TEAM_MEMBERS} members.`);
  }
  if (members.length < MIN_DRAFT_TEAM_SIZE) {
    blockingIssues.push(`A team needs at least ${MIN_DRAFT_TEAM_SIZE} players, including the captain.`);
  }

  if (starters.length !== 5) {
    blockingIssues.push(
      starters.length < 5
        ? `Add ${5 - starters.length} more starter${5 - starters.length === 1 ? "" : "s"}.`
        : "A team can have exactly five starters.",
    );
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

  const starterTierCounts = { T1: 0, T2: 0, T3: 0, T4: 0 };
  for (const member of starters) {
    if (member.approvedTier) starterTierCounts[member.approvedTier] += 1;
  }

  if (starterTierCounts.T1 > 1) {
    blockingIssues.push(
      `The starting lineup has ${starterTierCounts.T1} T1 players; the maximum is one.`,
    );
  }

  if (starterTierCounts.T2 > 2) {
    blockingIssues.push(
      `The starting lineup has ${starterTierCounts.T2} T2 players; the maximum is two.`,
    );
  }

  return {
    valid: blockingIssues.length === 0,
    blockingIssues: [...new Set(blockingIssues)],
    warnings: [...new Set(warnings)],
    tierCounts,
  };
}
