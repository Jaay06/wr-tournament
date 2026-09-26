export type FixtureStage = 'league' | 'semifinal' | 'final';
export type FixturePhase = 'draft' | 'league' | 'playoffs' | 'complete';

export type FixtureEntry = {
  teamId: string;
  name: string;
  seed: number;
};

export type FixtureMatch = {
  id: string;
  stage: FixtureStage;
  round: number;
  position: number;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string | null;
};

export type FixtureStanding = FixtureEntry & {
  played: number;
  wins: number;
  losses: number;
  gamesWon: number;
  gamesLost: number;
  gameDifference: number;
  headToHeadWins: number;
  points: number;
  // Equal groups require an organizer decision before playoff seeding.
  tieGroup: string;
};

export type FixtureBoard = {
  version: number;
  phase: FixturePhase;
  entries: FixtureEntry[];
  matches: FixtureMatch[];
  standings: FixtureStanding[];
  playoffOrder: string[] | null;
};

export type FixtureTeamOption = {
  id: string;
  name: string;
  status: 'draft' | 'submitted';
  memberCount: number;
};

export type FixtureActionState = {
  error?: string;
  success?: string;
};
