import type { TournamentTier } from "./tournament-types";

export const draftTiers = ["T1", "T2", "T3", "T4"] as const satisfies readonly TournamentTier[];

export type DraftDirection = "forward" | "reverse";

export type DraftCursor = {
  tier: TournamentTier;
  tierRound: number;
  round: number;
  teamIndex: number;
  direction: DraftDirection;
};

export type DraftTeamSnapshot = {
  teamId: string;
  memberCount: number;
  tierCounts: Record<TournamentTier, number>;
};

export type DraftPoolSnapshot = {
  registrationId: string;
  tier: TournamentTier;
  available: boolean;
};

export type DraftTransition = {
  cursor: DraftCursor;
  completed: boolean;
};

export function shuffleDraftOrder<T>(
  values: readonly T[],
  random: () => number = Math.random,
): T[] {
  const result = [...values];
  for (let index = result.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [result[index], result[swapIndex]] = [result[swapIndex], result[index]];
  }
  return result;
}

export function draftTierIndex(tier: TournamentTier) {
  return draftTiers.indexOf(tier);
}

export function draftTierRoundLimit(tier: TournamentTier) {
  if (tier === "T1") return 1;
  if (tier === "T2") return 2;
  return Number.POSITIVE_INFINITY;
}

export function canDraftTeamReceive(
  team: DraftTeamSnapshot,
  tier: TournamentTier,
) {
  if (team.memberCount >= 5) return false;
  if (tier === "T1" && team.tierCounts.T1 >= 1) return false;
  if (tier === "T2" && team.tierCounts.T2 >= 2) return false;
  return true;
}

export function hasEligibleDraftPlayer(
  team: DraftTeamSnapshot,
  tier: TournamentTier,
  pool: readonly DraftPoolSnapshot[],
) {
  return (
    canDraftTeamReceive(team, tier) &&
    pool.some((player) => player.available && player.tier === tier)
  );
}

function advancePosition(cursor: DraftCursor, teamCount: number) {
  if (teamCount <= 0) {
    return { cursor, completedRound: false };
  }

  if (cursor.direction === "forward") {
    if (cursor.teamIndex < teamCount - 1) {
      return {
        cursor: { ...cursor, teamIndex: cursor.teamIndex + 1 },
        completedRound: false,
      };
    }

    return {
      cursor: {
        ...cursor,
        direction: "reverse" as const,
        round: cursor.round + 1,
        tierRound: cursor.tierRound + 1,
      },
      completedRound: true,
    };
  }

  if (cursor.teamIndex > 0) {
    return {
      cursor: { ...cursor, teamIndex: cursor.teamIndex - 1 },
      completedRound: false,
    };
  }

  return {
    cursor: {
      ...cursor,
      direction: "forward" as const,
      round: cursor.round + 1,
      tierRound: cursor.tierRound + 1,
    },
    completedRound: true,
  };
}

function moveToNextTier(cursor: DraftCursor): DraftTransition {
  const nextTier = draftTiers[draftTierIndex(cursor.tier) + 1];
  if (!nextTier) {
    return { cursor, completed: true };
  }

  return {
    cursor: {
      ...cursor,
      tier: nextTier,
      tierRound: 1,
    },
    completed: false,
  };
}

/**
 * Resolve the next playable turn from a persisted cursor.
 *
 * Full teams and tier caps are skipped. When an entire tier has no legal
 * destination, the cursor walks the rest of that snake round before moving
 * to the next tier. This preserves endpoint turns at round boundaries even
 * when a tier empties halfway through a round.
 */
export function normalizeDraftCursor(
  cursor: DraftCursor,
  teams: readonly DraftTeamSnapshot[],
  pool: readonly DraftPoolSnapshot[],
): DraftTransition {
  if (teams.length === 0) return { cursor, completed: true };

  let next = { ...cursor };
  const guardLimit = teams.length * draftTiers.length * 8 + 16;

  for (let guard = 0; guard < guardLimit; guard += 1) {
    const currentTierPlayers = pool.filter(
      (player) => player.available && player.tier === next.tier,
    );
    const anyEligibleTeam = teams.some((team) =>
      canDraftTeamReceive(team, next.tier),
    );

    // The cursor is persisted as the next turn. A pick that ends a fixed
    // length tier (T1 or T2) advances the snake endpoint before arriving
    // here, so move to the next tier before exposing another turn from the
    // completed phase.
    if (next.tierRound > draftTierRoundLimit(next.tier)) {
      const transition = moveToNextTier(next);
      if (transition.completed) return transition;
      next = transition.cursor;
      continue;
    }

    if (currentTierPlayers.length === 0 || !anyEligibleTeam) {
      const advanced = advancePosition(next, teams.length);
      next = advanced.cursor;

      if (advanced.completedRound) {
        const tierLimitReached = next.tierRound > draftTierRoundLimit(next.tier);
        if (
          tierLimitReached ||
          currentTierPlayers.length === 0 ||
          !anyEligibleTeam
        ) {
          const transition = moveToNextTier(next);
          if (transition.completed) return transition;
          next = transition.cursor;
        }
      }
      continue;
    }

    const currentTeam = teams[next.teamIndex];
    if (currentTeam && canDraftTeamReceive(currentTeam, next.tier)) {
      return { cursor: next, completed: false };
    }

    const advanced = advancePosition(next, teams.length);
    next = advanced.cursor;
    if (advanced.completedRound) {
      const tierLimitReached = next.tierRound > draftTierRoundLimit(next.tier);
      if (tierLimitReached) {
        const transition = moveToNextTier(next);
        if (transition.completed) return transition;
        next = transition.cursor;
      }
    }
  }

  return { cursor: next, completed: true };
}

export function nextDraftCursorAfterPick(
  cursor: DraftCursor,
  teams: readonly DraftTeamSnapshot[],
  pool: readonly DraftPoolSnapshot[],
): DraftTransition {
  if (teams.length === 0) return { cursor, completed: true };
  const advanced = advancePosition(cursor, teams.length);
  const tierPlayersRemain = pool.some(
    (player) => player.available && player.tier === cursor.tier,
  );
  const anyEligibleTeam = teams.some((team) =>
    canDraftTeamReceive(team, cursor.tier),
  );

  // A pick at the end of a round already completed the skipped positions.
  // Move tiers from that endpoint directly so the next tier starts with the
  // repeated endpoint team (D, then D again in a four-team snake).
  if (
    advanced.completedRound &&
    (advanced.cursor.tierRound > draftTierRoundLimit(cursor.tier) ||
      !tierPlayersRemain ||
      !anyEligibleTeam)
  ) {
    const transition = moveToNextTier(advanced.cursor);
    if (transition.completed) return transition;
    return normalizeDraftCursor(transition.cursor, teams, pool);
  }

  return normalizeDraftCursor(advanced.cursor, teams, pool);
}

export function draftDirectionLabel(direction: DraftDirection) {
  return direction === "forward" ? "Forward" : "Reverse";
}

export function draftRoundLabel(cursor: Pick<DraftCursor, "tier" | "tierRound">) {
  const limit = draftTierRoundLimit(cursor.tier);
  if (!Number.isFinite(limit)) return `${cursor.tier} round ${cursor.tierRound}`;
  return `${cursor.tier} round ${cursor.tierRound} of ${limit}`;
}
