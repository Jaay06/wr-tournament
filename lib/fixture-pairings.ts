export type RoundRobinFixture = {
  round: number;
  homeTeamId: string;
  awayTeamId: string;
};

/**
 * Generate every single-round-robin matchup once using the circle method.
 *
 * The first team stays fixed while the remaining seeded teams rotate. An
 * odd-sized field gets a local bye slot, which is skipped rather than
 * emitted as a fixture.
 */
export function generateRoundRobin(
  teamIds: readonly string[],
): RoundRobinFixture[] {
  if (teamIds.length < 2) {
    throw new RangeError("A round robin requires at least two teams");
  }

  const seen = new Set<string>();
  for (const teamId of teamIds) {
    if (teamId.trim().length === 0) {
      throw new TypeError("Team identifiers must be non-empty strings");
    }

    if (seen.has(teamId)) {
      throw new Error(`Team identifiers must be unique: ${teamId}`);
    }

    seen.add(teamId);
  }

  const slots: Array<string | null> = [...teamIds];
  if (slots.length % 2 === 1) slots.push(null);

  const fixtures: RoundRobinFixture[] = [];
  const roundCount = slots.length - 1;

  for (let round = 1; round <= roundCount; round += 1) {
    for (let pairIndex = 0; pairIndex < slots.length / 2; pairIndex += 1) {
      const homeTeamId = slots[pairIndex];
      const awayTeamId = slots[slots.length - 1 - pairIndex];

      if (homeTeamId !== null && awayTeamId !== null) {
        fixtures.push({ round, homeTeamId, awayTeamId });
      }
    }

    // Keep the first seed fixed and rotate every other slot clockwise.
    const lastSlot = slots.pop();
    if (lastSlot !== undefined) slots.splice(1, 0, lastSlot);
  }

  return fixtures;
}
