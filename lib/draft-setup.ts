export const MIN_DRAFT_TEAM_SIZE = 6;

/** Allocate every player, with at most one player separating roster sizes. */
export function draftTeamSizes(playerCount: number): number[] {
  const teamCount = Math.floor(playerCount / MIN_DRAFT_TEAM_SIZE);
  if (teamCount === 0) return [];
  const baseSize = Math.floor(playerCount / teamCount);
  const extraPlayers = playerCount % teamCount;
  return Array.from({ length: teamCount }, (_, index) =>
    baseSize + (index < extraPlayers ? 1 : 0),
  );
}

export function draftTeamName(index: number): string {
  let label = "";
  for (let value = index + 1; value > 0; value = Math.floor((value - 1) / 26)) {
    label = String.fromCharCode(65 + ((value - 1) % 26)) + label;
  }
  return `Team ${label}`;
}
