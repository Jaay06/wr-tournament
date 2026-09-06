export type TournamentTier = "T1" | "T2" | "T3" | "T4";

export type TournamentRole =
  | "Baron"
  | "Jungle"
  | "Mid"
  | "Dragon"
  | "Support";

export type TournamentRegistrationData = {
  id: string;
  riotName: string;
  riotTag: string;
  currentRank: string;
  selfAssessedTier: TournamentTier;
  approvedTier: TournamentTier | null;
  tierStatus: "pending" | "approved";
  primaryRole: TournamentRole;
  secondaryRole: TournamentRole;
};

export type AccountConnectionsData = {
  email: string | null;
  discordConnected: boolean;
  discordEnabled: boolean;
};

export type TournamentMemberData = {
  id: string;
  registrationId: string;
  isDeleted?: boolean;
  displayName: string;
  avatarUrl: string | null;
  riotName: string;
  riotTag: string;
  currentRank: string;
  approvedTier: TournamentTier | null;
  tierStatus: "pending" | "approved";
  primaryRole: TournamentRole;
  secondaryRole: TournamentRole;
  isCaptain: boolean;
  lineupPosition: "starter" | "substitute";
  starterRole: TournamentRole | null;
};

export type TournamentTeamDetailData = {
  id: string;
  name: string;
  status: "draft" | "submitted";
  submittedAt: string | null;
  members: TournamentMemberData[];
};

export type TournamentTeamData = TournamentTeamDetailData & {
  joinRequests: Array<{
    id: string;
    registrationId: string;
    displayName: string;
    riotName: string;
    riotTag: string;
    approvedTier: TournamentTier | null;
    primaryRole: TournamentRole;
    secondaryRole: TournamentRole;
    status: "pending" | "accepted" | "declined" | "revoked";
  }>;
  invites: Array<{
    id: string;
    invitedRegistrationId: string;
    displayName: string;
    riotName: string;
    riotTag: string;
    approvedTier: TournamentTier | null;
    status: "pending" | "accepted" | "declined" | "revoked";
  }>;
};

export type TournamentIncomingInviteData = {
  id: string;
  teamId: string;
  teamName: string;
  captainName: string;
  captainRiotId: string;
  status: "pending";
};

export type TournamentTeamSummary = {
  id: string;
  name: string;
  status: "draft" | "submitted";
  memberCount: number;
  captain: string;
  tierCounts: Record<TournamentTier, number>;
};

export type TournamentParticipantOption = {
  id: string;
  displayName: string;
  riotName: string;
  riotTag: string;
  approvedTier: TournamentTier | null;
  teamId: string | null;
};

export type TournamentPlayerProfileData = {
  id: string;
  isDeleted?: boolean;
  displayName: string;
  avatarUrl: string | null;
  riotName: string;
  riotTag: string;
  currentRank: string;
  approvedTier: TournamentTier | null;
  tierStatus: "pending" | "approved";
  primaryRole: TournamentRole;
  secondaryRole: TournamentRole;
  team: {
    id: string;
    name: string;
    status: "draft" | "submitted";
  } | null;
};

export type TierReviewData = {
  id: string;
  displayName: string;
  riotName: string;
  riotTag: string;
  currentRank: string;
  selfAssessedTier: TournamentTier;
  approvedTier: TournamentTier | null;
  tierStatus: "pending" | "approved";
  primaryRole: TournamentRole;
  secondaryRole: TournamentRole;
  joinedAt: string;
  updatedAt: string;
  pendingCount: number;
  pendingReviews?: Array<{
    id: string;
    displayName: string;
    riotName: string;
    riotTag: string;
    currentRank: string;
    selfAssessedTier: TournamentTier;
    primaryRole: TournamentRole;
    secondaryRole: TournamentRole;
  }>;
};

export type TournamentAnnouncementData = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
};

export type TournamentNotificationData = {
  id: string;
  type: string;
  message: string;
  status: "unread" | "read";
  createdAt: string;
};

export type TournamentDashboardData = {
  announcements: TournamentAnnouncementData[];
  notifications: TournamentNotificationData[];
};

export type DraftStatus =
  | "active"
  | "paused"
  | "completed"
  | "needs_repair";

export type DraftPickData = {
  id: string;
  turnNumber: number;
  round: number;
  tier: TournamentTier;
  direction: "forward" | "reverse";
  teamId: string;
  teamName: string;
  registrationId: string;
  displayName: string;
  riotName: string;
  riotTag: string;
  source: "captain" | "organizer" | "auto";
  committedAt: string;
  undoneAt: string | null;
};

export type DraftPlayerData = {
  id: string;
  registrationId: string;
  displayName: string;
  avatarUrl: string | null;
  riotName: string;
  riotTag: string;
  currentRank: string;
  approvedTier: TournamentTier;
  primaryRole: TournamentRole;
  secondaryRole: TournamentRole;
  available: boolean;
};

export type DraftTeamData = {
  id: string;
  name: string;
  orderIndex: number;
  captainRegistrationId: string;
  captainName: string;
  captainRiotId: string;
  memberCount: number;
  tierCounts: Record<TournamentTier, number>;
  incomplete: boolean;
  members: TournamentMemberData[];
};

export type DraftBoardData = {
  id: string;
  status: DraftStatus;
  currentTier: TournamentTier;
  currentRound: number;
  currentTierRound: number;
  direction: "forward" | "reverse";
  turnNumber: number;
  version: number;
  turnStartedAt: string;
  turnEndsAt: string;
  pausedRemainingSeconds: number | null;
  currentTeamId: string | null;
  currentCaptainName: string | null;
  currentCaptainUserId: string | null;
  nextTeamId: string | null;
  teams: DraftTeamData[];
  players: DraftPlayerData[];
  picks: DraftPickData[];
  incompleteTeamIds: string[];
  viewer: {
    registrationId: string | null;
    isOrganizer: boolean;
    isCurrentCaptain: boolean;
    canPick: boolean;
    canUndo: boolean;
  };
};

export type OrganizerOverviewData = {
  joinedCount: number;
  registeredCount: number;
  pendingTierCount: number;
  teamCount: number;
  draftTeamCount: number;
  submittedTeamCount: number;
  blockedTeamCount: number;
  pendingReviews: Array<{
    id: string;
    displayName: string;
    riotName: string;
    riotTag: string;
    currentRank: string;
    selfAssessedTier: TournamentTier;
    primaryRole: TournamentRole;
    secondaryRole: TournamentRole;
  }>;
};
