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

export type TournamentMemberData = {
  id: string;
  registrationId: string;
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

export type TournamentTeamData = {
  id: string;
  name: string;
  status: "draft" | "submitted";
  submittedAt: string | null;
  members: TournamentMemberData[];
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
