import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import {
  announcements,
  notifications,
  playerRegistrations,
  teamInvites,
  teamJoinRequests,
  teamMembers,
  teams,
  tournamentParticipants,
  users,
} from "@/db/schema";
import { validateRoster } from "@/lib/tournament-rules";

import type {
  TierReviewData,
  TournamentMemberData,
  TournamentParticipantOption,
  TournamentRegistrationData,
  TournamentTeamData,
  TournamentTeamSummary,
  OrganizerOverviewData,
  TournamentAnnouncementData,
  TournamentDashboardData,
} from "./tournament-types";

function toRegistrationData(
  registration: typeof playerRegistrations.$inferSelect,
): TournamentRegistrationData {
  return {
    id: registration.id,
    riotName: registration.riotName,
    riotTag: registration.riotTag,
    currentRank: registration.currentRank,
    selfAssessedTier: registration.selfAssessedTier,
    approvedTier: registration.approvedTier,
    tierStatus: registration.tierStatus,
    primaryRole: registration.primaryRole,
    secondaryRole: registration.secondaryRole,
  };
}

export async function getRegistrationForParticipant(
  participantId: string,
): Promise<TournamentRegistrationData | null> {
  const [registration] = await db
    .select()
    .from(playerRegistrations)
    .where(eq(playerRegistrations.participantId, participantId))
    .limit(1);

  return registration ? toRegistrationData(registration) : null;
}

function toMemberData(row: {
  member: typeof teamMembers.$inferSelect;
  registration: typeof playerRegistrations.$inferSelect;
  user: typeof users.$inferSelect;
}): TournamentMemberData {
  return {
    id: row.member.id,
    registrationId: row.registration.id,
    displayName: row.user.displayName,
    avatarUrl: row.user.avatarUrl,
    riotName: row.registration.riotName,
    riotTag: row.registration.riotTag,
    currentRank: row.registration.currentRank,
    approvedTier: row.registration.approvedTier,
    tierStatus: row.registration.tierStatus,
    primaryRole: row.registration.primaryRole,
    secondaryRole: row.registration.secondaryRole,
    isCaptain: row.member.isCaptain,
    lineupPosition: row.member.lineupPosition,
    starterRole: row.member.starterRole,
  };
}

export async function getTeamForRegistration(
  registrationId: string,
): Promise<TournamentTeamData | null> {
  const [membership] = await db
    .select({ teamId: teamMembers.teamId })
    .from(teamMembers)
    .where(eq(teamMembers.registrationId, registrationId))
    .limit(1);

  if (!membership) {
    return null;
  }

  const [team] = await db
    .select()
    .from(teams)
    .where(eq(teams.id, membership.teamId))
    .limit(1);

  if (!team) {
    return null;
  }

  const memberRows = await db
    .select({ member: teamMembers, registration: playerRegistrations, user: users })
    .from(teamMembers)
    .innerJoin(
      playerRegistrations,
      eq(teamMembers.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(teamMembers.teamId, team.id))
    .orderBy(asc(teamMembers.joinedAt));

  const requestRows = await db
    .select({
      id: teamJoinRequests.id,
      registrationId: teamJoinRequests.registrationId,
      status: teamJoinRequests.status,
      displayName: users.displayName,
      riotName: playerRegistrations.riotName,
      riotTag: playerRegistrations.riotTag,
      approvedTier: playerRegistrations.approvedTier,
      primaryRole: playerRegistrations.primaryRole,
      secondaryRole: playerRegistrations.secondaryRole,
    })
    .from(teamJoinRequests)
    .innerJoin(
      playerRegistrations,
      eq(teamJoinRequests.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(teamJoinRequests.teamId, team.id))
    .orderBy(asc(teamJoinRequests.createdAt));

  const inviteRows = await db
    .select({
      id: teamInvites.id,
      invitedRegistrationId: teamInvites.invitedRegistrationId,
      status: teamInvites.status,
      displayName: users.displayName,
      riotName: playerRegistrations.riotName,
      riotTag: playerRegistrations.riotTag,
      approvedTier: playerRegistrations.approvedTier,
    })
    .from(teamInvites)
    .innerJoin(
      playerRegistrations,
      eq(teamInvites.invitedRegistrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(teamInvites.teamId, team.id))
    .orderBy(asc(teamInvites.createdAt));

  return {
    id: team.id,
    name: team.name,
    status: team.status,
    submittedAt: team.submittedAt?.toISOString() ?? null,
    members: memberRows.map(toMemberData),
    joinRequests: requestRows,
    invites: inviteRows,
  };
}

export async function getTeamDirectory(): Promise<TournamentTeamSummary[]> {
  const rows = await db
    .select({
      team: teams,
      member: teamMembers,
      registration: playerRegistrations,
      participant: tournamentParticipants,
      user: users,
    })
    .from(teams)
    .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .leftJoin(
      playerRegistrations,
      eq(teamMembers.registrationId, playerRegistrations.id),
    )
    .leftJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .leftJoin(users, eq(tournamentParticipants.userId, users.id))
    .orderBy(asc(teams.createdAt), asc(teamMembers.joinedAt));

  const byTeam = new Map<
    string,
    {
      team: typeof teams.$inferSelect;
      members: Array<{
        member: typeof teamMembers.$inferSelect;
        registration: typeof playerRegistrations.$inferSelect;
        user: typeof users.$inferSelect;
      }>;
    }
  >();

  for (const row of rows) {
    const current = byTeam.get(row.team.id) ?? { team: row.team, members: [] };
    if (row.member && row.registration && row.user) {
      current.members.push({
        member: row.member,
        registration: row.registration,
        user: row.user,
      });
    }
    byTeam.set(row.team.id, current);
  }

  return [...byTeam.values()].map(({ team, members }) => {
    const tierCounts: TournamentTeamSummary["tierCounts"] = {
      T1: 0,
      T2: 0,
      T3: 0,
      T4: 0,
    };
    const captain = members.find(({ member }) => member.isCaptain);

    for (const { registration } of members) {
      if (registration.approvedTier) {
        tierCounts[registration.approvedTier] += 1;
      }
    }

    return {
      id: team.id,
      name: team.name,
      status: team.status,
      memberCount: members.length,
      captain: captain
        ? `${captain.registration.riotName}#${captain.registration.riotTag}`
        : "No captain",
      tierCounts,
    };
  });
}

export async function getAllTeamDetails(): Promise<TournamentTeamData[]> {
  const rows = await db
    .select({
      teamId: teams.id,
      registrationId: teamMembers.registrationId,
    })
    .from(teams)
    .innerJoin(teamMembers, eq(teams.id, teamMembers.teamId))
    .orderBy(asc(teams.createdAt), asc(teamMembers.joinedAt));

  const firstMemberByTeam = new Map<string, string>();
  for (const row of rows) {
    if (!firstMemberByTeam.has(row.teamId)) {
      firstMemberByTeam.set(row.teamId, row.registrationId);
    }
  }

  const details = await Promise.all(
    [...firstMemberByTeam.values()].map((registrationId) =>
      getTeamForRegistration(registrationId),
    ),
  );

  return details.filter((team): team is TournamentTeamData => Boolean(team));
}

export async function getParticipantDirectory(): Promise<TournamentParticipantOption[]> {
  const rows = await db
    .select({
      id: playerRegistrations.id,
      displayName: users.displayName,
      riotName: playerRegistrations.riotName,
      riotTag: playerRegistrations.riotTag,
      approvedTier: playerRegistrations.approvedTier,
    })
    .from(playerRegistrations)
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .orderBy(asc(users.displayName));

  return rows;
}

export async function getTierReview(
  registrationId?: string,
): Promise<TierReviewData | null> {
  const pendingRows = await db
    .select({
      registration: playerRegistrations,
      joinedAt: tournamentParticipants.joinedAt,
      updatedAt: playerRegistrations.updatedAt,
      displayName: users.displayName,
    })
    .from(playerRegistrations)
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(eq(playerRegistrations.tierStatus, "pending"))
    .orderBy(asc(playerRegistrations.createdAt));

  if (pendingRows.length === 0) {
    return null;
  }

  const row =
    (registrationId
      ? pendingRows.find(({ registration }) => registration.id === registrationId)
      : undefined) ?? pendingRows[0];

  return {
    id: row.registration.id,
    displayName: row.displayName,
    riotName: row.registration.riotName,
    riotTag: row.registration.riotTag,
    currentRank: row.registration.currentRank,
    selfAssessedTier: row.registration.selfAssessedTier,
    approvedTier: row.registration.approvedTier,
    tierStatus: row.registration.tierStatus,
    primaryRole: row.registration.primaryRole,
    secondaryRole: row.registration.secondaryRole,
    joinedAt: row.joinedAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
    pendingCount: pendingRows.length,
    pendingReviews: pendingRows.map(({ registration, displayName }) => ({
      id: registration.id,
      displayName,
      riotName: registration.riotName,
      riotTag: registration.riotTag,
      currentRank: registration.currentRank,
      selfAssessedTier: registration.selfAssessedTier,
      primaryRole: registration.primaryRole,
      secondaryRole: registration.secondaryRole,
    })),
  };
}

export async function getRegistrationWithParticipant(
  userId: string,
): Promise<{
  participantId: string;
  registration: TournamentRegistrationData | null;
} | null> {
  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, userId))
    .limit(1);

  if (!participant) {
    return null;
  }

  return {
    participantId: participant.id,
    registration: await getRegistrationForParticipant(participant.id),
  };
}

export async function getParticipantDashboardData(
  userId: string,
): Promise<TournamentDashboardData> {
  const [announcementRows, notificationRows] = await Promise.all([
    db
      .select({
        id: announcements.id,
        title: announcements.title,
        body: announcements.body,
        createdAt: announcements.createdAt,
      })
      .from(announcements)
      .orderBy(desc(announcements.createdAt))
      .limit(3),
    db
      .select({
        id: notifications.id,
        type: notifications.type,
        message: notifications.message,
        status: notifications.status,
        createdAt: notifications.createdAt,
      })
      .from(notifications)
      .where(eq(notifications.userId, userId))
      .orderBy(desc(notifications.createdAt))
      .limit(4),
  ]);

  return {
    announcements: announcementRows.map((announcement) => ({
      ...announcement,
      createdAt: announcement.createdAt.toISOString(),
    })),
    notifications: notificationRows.map((notification) => ({
      ...notification,
      createdAt: notification.createdAt.toISOString(),
    })),
  };
}

export async function getAnnouncements(): Promise<TournamentAnnouncementData[]> {
  const rows = await db
    .select({
      id: announcements.id,
      title: announcements.title,
      body: announcements.body,
      createdAt: announcements.createdAt,
    })
    .from(announcements)
    .orderBy(desc(announcements.createdAt));

  return rows.map((announcement) => ({
    ...announcement,
    createdAt: announcement.createdAt.toISOString(),
  }));
}

export async function getOrganizerOverviewData(): Promise<OrganizerOverviewData> {
  const [participantRows, registrationRows, pendingRows, teamRows] = await Promise.all([
    db.select({ id: tournamentParticipants.id }).from(tournamentParticipants),
    db.select({ id: playerRegistrations.id }).from(playerRegistrations),
    db
      .select({
        id: playerRegistrations.id,
        displayName: users.displayName,
        riotName: playerRegistrations.riotName,
        riotTag: playerRegistrations.riotTag,
        currentRank: playerRegistrations.currentRank,
        selfAssessedTier: playerRegistrations.selfAssessedTier,
        primaryRole: playerRegistrations.primaryRole,
        secondaryRole: playerRegistrations.secondaryRole,
      })
      .from(playerRegistrations)
      .innerJoin(
        tournamentParticipants,
        eq(playerRegistrations.participantId, tournamentParticipants.id),
      )
      .innerJoin(users, eq(tournamentParticipants.userId, users.id))
      .where(eq(playerRegistrations.tierStatus, "pending"))
      .orderBy(asc(playerRegistrations.createdAt))
      .limit(6),
    db
      .select({ team: teams, member: teamMembers, registration: playerRegistrations, user: users })
      .from(teams)
      .leftJoin(teamMembers, eq(teams.id, teamMembers.teamId))
      .leftJoin(
        playerRegistrations,
        eq(teamMembers.registrationId, playerRegistrations.id),
      )
      .leftJoin(
        tournamentParticipants,
        eq(playerRegistrations.participantId, tournamentParticipants.id),
      )
      .leftJoin(users, eq(tournamentParticipants.userId, users.id)),
  ]);

  const byTeam = new Map<string, { team: typeof teams.$inferSelect; members: Array<{ member: typeof teamMembers.$inferSelect; registration: typeof playerRegistrations.$inferSelect; user: typeof users.$inferSelect }> }>();
  for (const row of teamRows) {
    const current = byTeam.get(row.team.id) ?? { team: row.team, members: [] };
    if (row.member && row.registration && row.user) {
      current.members.push({ member: row.member, registration: row.registration, user: row.user });
    }
    byTeam.set(row.team.id, current);
  }

  let blockedTeamCount = 0;
  for (const { team, members } of byTeam.values()) {
    const validation = validateRoster(
      members.map(({ member, registration, user }) => ({
        displayName: user.displayName,
        approvedTier: registration.approvedTier,
        lineupPosition: member.lineupPosition,
        starterRole: member.starterRole,
        primaryRole: registration.primaryRole,
        secondaryRole: registration.secondaryRole,
      })),
    );
    if (!validation.valid) {
      blockedTeamCount += 1;
    }
    void team;
  }

  return {
    joinedCount: participantRows.length,
    registeredCount: registrationRows.length,
    pendingTierCount: pendingRows.length,
    teamCount: byTeam.size,
    draftTeamCount: [...byTeam.values()].filter(({ team }) => team.status === "draft").length,
    submittedTeamCount: [...byTeam.values()].filter(({ team }) => team.status === "submitted").length,
    blockedTeamCount,
    pendingReviews: pendingRows,
  };
}

export async function getCaptainUserId(
  teamId: string,
): Promise<string | null> {
  const [row] = await db
    .select({ userId: tournamentParticipants.userId })
    .from(teamMembers)
    .innerJoin(
      playerRegistrations,
      eq(teamMembers.registrationId, playerRegistrations.id),
    )
    .innerJoin(
      tournamentParticipants,
      eq(playerRegistrations.participantId, tournamentParticipants.id),
    )
    .where(and(eq(teamMembers.teamId, teamId), eq(teamMembers.isCaptain, true)))
    .limit(1);

  return row?.userId ?? null;
}
