"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  notifications,
  playerRegistrations,
  teamInvites,
  teamJoinRequests,
  teamMembers,
  teams,
  tournamentParticipants,
  tournamentSettings,
  users,
} from "@/db/schema";
import { validateRoster } from "@/lib/tournament-rules";
import type { TournamentRegistrationData } from "@/lib/tournament-types";
import {
  lineupSchema,
  playerRegistrationSchema,
  teamIdSchema,
  teamNameSchema,
  tierSchema,
} from "@/lib/validation";

export type TournamentActionState = {
  code?: string;
  error?: string;
  success?: string;
  teamId?: string;
  blockingIssues?: string[];
  warnings?: string[];
  registration?: TournamentRegistrationData;
};

function formString(formData: FormData, name: string) {
  const value = formData.get(name);
  return typeof value === "string" ? value : undefined;
}

function deadlinePassed(deadline: Date | null | undefined) {
  return Boolean(deadline && deadline.getTime() <= Date.now());
}

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

function revalidateTournamentPages() {
  revalidatePath("/tournament");
  revalidatePath("/tournament/register");
  revalidatePath("/tournament/profile");
  revalidatePath("/tournament/team");
  revalidatePath("/tournament/teams");
  revalidatePath("/admin");
  revalidatePath("/admin/tier-review");
}

export async function savePlayerRegistration(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before registering." };
  }

  const parsed = playerRegistrationSchema.safeParse({
    riotName: formString(formData, "riotName"),
    riotTag: formString(formData, "riotTag"),
    currentRank: formString(formData, "currentRank"),
    selfAssessedTier: formString(formData, "selfAssessedTier"),
    primaryRole: formString(formData, "primaryRole"),
    secondaryRole: formString(formData, "secondaryRole"),
  });

  if (!parsed.success) {
    return {
      code: "VALIDATION_ERROR",
      error: "Enter your Riot ID, rank, tier, and two different role preferences.",
    };
  }

  try {
    const savedRegistration = await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);

      if (!settings) {
        throw new TournamentActionError(
          "TOURNAMENT_NOT_CONFIGURED",
          "The tournament has not been set up yet.",
        );
      }

      if (deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError(
          "DEADLINE_PASSED",
          "Registration changes are closed because the deadline has passed.",
        );
      }

      const [participant] = await tx
        .select({ id: tournamentParticipants.id })
        .from(tournamentParticipants)
        .where(eq(tournamentParticipants.userId, session.user.id))
        .limit(1);

      if (!participant) {
        throw new TournamentActionError(
          "TOURNAMENT_ACCESS_REQUIRED",
          "Join the tournament before completing registration.",
        );
      }

      const [existing] = await tx
        .select()
        .from(playerRegistrations)
        .where(eq(playerRegistrations.participantId, participant.id))
        .limit(1);

      const tierChanged = Boolean(
        existing &&
          (existing.currentRank !== parsed.data.currentRank ||
            existing.selfAssessedTier !== parsed.data.selfAssessedTier),
      );
      const approvedTier = tierChanged ? null : existing?.approvedTier ?? null;
      const tierStatus = approvedTier ? "approved" : "pending";

      let registrationId = existing?.id;

      if (existing) {
        await tx
          .update(playerRegistrations)
          .set({
            riotName: parsed.data.riotName,
            riotTag: parsed.data.riotTag,
            currentRank: parsed.data.currentRank,
            selfAssessedTier: parsed.data.selfAssessedTier,
            approvedTier,
            tierStatus,
            primaryRole: parsed.data.primaryRole,
            secondaryRole: parsed.data.secondaryRole,
            updatedAt: new Date(),
          })
          .where(eq(playerRegistrations.id, existing.id));
      } else {
        const [created] = await tx
          .insert(playerRegistrations)
          .values({
            participantId: participant.id,
            riotName: parsed.data.riotName,
            riotTag: parsed.data.riotTag,
            currentRank: parsed.data.currentRank,
            selfAssessedTier: parsed.data.selfAssessedTier,
            approvedTier: null,
            tierStatus: "pending",
            primaryRole: parsed.data.primaryRole,
            secondaryRole: parsed.data.secondaryRole,
          })
          .returning({ id: playerRegistrations.id });
        registrationId = created.id;
      }

      if (existing && tierChanged) {
        const [membership] = await tx
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.registrationId, existing.id))
          .limit(1);

        if (membership) {
          const [team] = await tx
            .select({ id: teams.id, status: teams.status })
            .from(teams)
            .where(eq(teams.id, membership.teamId))
            .limit(1);

          if (team?.status === "submitted") {
            await tx
              .update(teams)
              .set({ status: "draft", submittedAt: null, updatedAt: new Date() })
              .where(eq(teams.id, team.id));

            const [captain] = await tx
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
              .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isCaptain, true)))
              .limit(1);

            if (captain) {
              await tx.insert(notifications).values({
                userId: captain.userId,
                type: "team_reopened",
                message: "Your submitted team returned to draft because a member changed their registration.",
              });
            }
          }
        }
      }

      return {
        id: registrationId as string,
        riotName: parsed.data.riotName,
        riotTag: parsed.data.riotTag,
        currentRank: parsed.data.currentRank,
        selfAssessedTier: parsed.data.selfAssessedTier,
        approvedTier,
        tierStatus,
        primaryRole: parsed.data.primaryRole,
        secondaryRole: parsed.data.secondaryRole,
      } satisfies TournamentRegistrationData;
    });

    revalidateTournamentPages();
    return {
      success: "Registration sent for organizer review.",
      registration: savedRegistration,
    };
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return {
        code: "CONFLICT",
        error: "You already have a tournament registration. Refresh and try again.",
      };
    }
    throw error;
  }

}

export async function createTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before creating a team." };
  }

  const teamName = teamNameSchema.safeParse(formString(formData, "teamName"));
  if (!teamName.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a team name between 2 and 60 characters." };
  }

  try {
    const teamId = await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);

      if (!settings) {
        throw new TournamentActionError("TOURNAMENT_NOT_CONFIGURED", "The tournament has not been set up yet.");
      }
      if (deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [registration] = await tx
        .select({ id: playerRegistrations.id, primaryRole: playerRegistrations.primaryRole })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(tournamentParticipants.userId, session.user.id))
        .limit(1);

      if (!registration) {
        throw new TournamentActionError("REGISTRATION_REQUIRED", "Complete your player registration before creating a team.");
      }

      const [existingMembership] = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.registrationId, registration.id))
        .limit(1);

      if (existingMembership) {
        throw new TournamentActionError("ALREADY_ON_TEAM", "Leave your current team before creating another one.");
      }

      const [team] = await tx
        .insert(teams)
        .values({ name: teamName.data })
        .returning({ id: teams.id });

      await tx.insert(teamMembers).values({
        teamId: team.id,
        registrationId: registration.id,
        isCaptain: true,
        lineupPosition: "starter",
        starterRole: registration.primaryRole,
      });

      return team.id;
    });

    revalidateTournamentPages();
    return { success: "Team created.", teamId };
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "That team name is already taken." };
    }
    throw error;
  }
}

export async function requestToJoinTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before requesting to join." };
  }

  const parsedTeamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  if (!parsedTeamId.success) {
    return { code: "VALIDATION_ERROR", error: "That team could not be found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings) {
        throw new TournamentActionError("TOURNAMENT_NOT_CONFIGURED", "The tournament has not been set up yet.");
      }
      if (deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [registration] = await tx
        .select({ id: playerRegistrations.id })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(tournamentParticipants.userId, session.user.id))
        .limit(1);
      if (!registration) {
        throw new TournamentActionError("REGISTRATION_REQUIRED", "Complete your player registration before joining a team.");
      }

      const [team] = await tx
        .select({ id: teams.id, status: teams.status })
        .from(teams)
        .where(eq(teams.id, parsedTeamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new TournamentActionError("NOT_FOUND", "That team no longer exists.");
      }
      if (team.status !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams cannot accept join requests.");
      }

      const members = await tx
        .select({ registrationId: teamMembers.registrationId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      if (members.some((member) => member.registrationId === registration.id)) {
        throw new TournamentActionError("ALREADY_ON_TEAM", "You are already on this team.");
      }
      const [currentMembership] = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.registrationId, registration.id))
        .limit(1);
      if (currentMembership) {
        throw new TournamentActionError("ALREADY_ON_TEAM", "You can only belong to one team.");
      }
      if (members.length >= 7) {
        throw new TournamentActionError("TEAM_FULL", "That team already has seven members.");
      }

      const [pending] = await tx
        .select({ id: teamJoinRequests.id })
        .from(teamJoinRequests)
        .where(
          and(
            eq(teamJoinRequests.teamId, team.id),
            eq(teamJoinRequests.registrationId, registration.id),
            eq(teamJoinRequests.status, "pending"),
          ),
        )
        .limit(1);
      if (pending) {
        throw new TournamentActionError("CONFLICT", "You already have a pending request for this team.");
      }

      await tx.insert(teamJoinRequests).values({
        teamId: team.id,
        registrationId: registration.id,
      });

      const [captain] = await tx
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
        .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isCaptain, true)))
        .limit(1);
      if (captain && captain.userId !== session.user.id) {
        await tx.insert(notifications).values({
          userId: captain.userId,
          type: "team_join_request",
          message: "A participant requested to join your team.",
        });
      }
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "A request for this team is already pending." };
    }
    throw error;
  }

  revalidateTournamentPages();
  return {
    success: "Join request sent to the captain.",
    teamId: parsedTeamId.data,
  };
}

export async function respondToJoinRequest(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before responding to a request." };
  }

  const requestId = formString(formData, "requestId");
  const decision = formString(formData, "decision");
  if (!requestId || (decision !== "accepted" && decision !== "declined")) {
    return { code: "VALIDATION_ERROR", error: "Choose whether to accept or decline the request." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [request] = await tx
        .select({
          id: teamJoinRequests.id,
          teamId: teamJoinRequests.teamId,
          registrationId: teamJoinRequests.registrationId,
          status: teamJoinRequests.status,
          teamStatus: teams.status,
        })
        .from(teamJoinRequests)
        .innerJoin(teams, eq(teamJoinRequests.teamId, teams.id))
        .where(eq(teamJoinRequests.id, requestId))
        .for("update")
        .limit(1);
      if (!request || request.status !== "pending") {
        throw new TournamentActionError("NOT_FOUND", "That join request is no longer pending.");
      }
      if (request.teamStatus !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams cannot resolve join requests.");
      }

      const [captain] = await tx
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
        .where(and(eq(teamMembers.teamId, request.teamId), eq(teamMembers.isCaptain, true)))
        .limit(1);
      if (!captain || captain.userId !== session.user.id) {
        throw new TournamentActionError("NOT_TEAM_CAPTAIN", "Only the team captain can resolve requests.");
      }

      await tx
        .update(teamJoinRequests)
        .set({ status: decision, respondedAt: new Date() })
        .where(eq(teamJoinRequests.id, request.id));

      if (decision === "accepted") {
        const members = await tx
          .select({ registrationId: teamMembers.registrationId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, request.teamId));
        if (members.length >= 7) {
          throw new TournamentActionError("TEAM_FULL", "The team reached seven members before this request was accepted.");
        }
        if (members.some((member) => member.registrationId === request.registrationId)) {
          throw new TournamentActionError("ALREADY_ON_TEAM", "That player is already on the team.");
        }
        const [otherTeam] = await tx
          .select({ teamId: teamMembers.teamId })
          .from(teamMembers)
          .where(eq(teamMembers.registrationId, request.registrationId))
          .limit(1);
        if (otherTeam) {
          throw new TournamentActionError("ALREADY_ON_TEAM", "That player has already joined another team.");
        }

        await tx.insert(teamMembers).values({
          teamId: request.teamId,
          registrationId: request.registrationId,
          isCaptain: false,
          lineupPosition: "substitute",
          starterRole: null,
        });
        await tx
          .update(teamJoinRequests)
          .set({ status: "revoked", respondedAt: new Date() })
          .where(
            and(
              eq(teamJoinRequests.registrationId, request.registrationId),
              eq(teamJoinRequests.status, "pending"),
            ),
          );
        await tx
          .update(teamInvites)
          .set({ status: "revoked", respondedAt: new Date() })
          .where(
            and(
              eq(teamInvites.invitedRegistrationId, request.registrationId),
              eq(teamInvites.status, "pending"),
            ),
          );
      }

      const [requester] = await tx
        .select({ userId: tournamentParticipants.userId })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(playerRegistrations.id, request.registrationId))
        .limit(1);
      if (requester) {
        await tx.insert(notifications).values({
          userId: requester.userId,
          type: "team_join_request_decision",
          message:
            decision === "accepted"
              ? "Your request to join a team was accepted."
              : "Your request to join a team was declined.",
        });
      }
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "That player joined another team first." };
    }
    throw error;
  }

  revalidateTournamentPages();
  return { success: decision === "accepted" ? "Player added to the team." : "Request declined." };
}

export async function inviteParticipant(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before inviting a player." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const invitedRegistrationId = teamIdSchema.safeParse(
    formString(formData, "invitedRegistrationId"),
  );
  if (!teamId.success || !invitedRegistrationId.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a registered player to invite." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [captain] = await tx
        .select({ registrationId: teamMembers.registrationId, teamStatus: teams.status })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, teamId.data),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!captain) {
        throw new TournamentActionError("NOT_TEAM_CAPTAIN", "Only the team captain can invite players.");
      }
      if (captain.teamStatus !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams cannot send invitations.");
      }

      const members = await tx
        .select({ registrationId: teamMembers.registrationId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId.data));
      if (members.length >= 7) {
        throw new TournamentActionError("TEAM_FULL", "Your team already has seven members.");
      }
      if (members.some((member) => member.registrationId === invitedRegistrationId.data)) {
        throw new TournamentActionError("ALREADY_ON_TEAM", "That player is already on your team.");
      }

      const [target] = await tx
        .select({ id: playerRegistrations.id, userId: tournamentParticipants.userId })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(playerRegistrations.id, invitedRegistrationId.data))
        .limit(1);
      if (!target) {
        throw new TournamentActionError("NOT_FOUND", "That participant is not registered.");
      }
      const [otherTeam] = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.registrationId, target.id))
        .limit(1);
      if (otherTeam) {
        throw new TournamentActionError("ALREADY_ON_TEAM", "That player already belongs to a team.");
      }

      const [pending] = await tx
        .select({ id: teamInvites.id })
        .from(teamInvites)
        .where(
          and(
            eq(teamInvites.teamId, teamId.data),
            eq(teamInvites.invitedRegistrationId, target.id),
            eq(teamInvites.status, "pending"),
          ),
        )
        .limit(1);
      if (pending) {
        throw new TournamentActionError("CONFLICT", "That player already has a pending invitation.");
      }

      const [created] = await tx
        .insert(teamInvites)
        .values({
          teamId: teamId.data,
          invitedRegistrationId: target.id,
          invitedByRegistrationId: captain.registrationId,
        })
        .returning({ id: teamInvites.id });
      void created;
      if (target.userId !== session.user.id) {
        await tx.insert(notifications).values({
          userId: target.userId,
          type: "team_invite",
          message: "You received an invitation to join a tournament team.",
        });
      }
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "That invitation is already pending." };
    }
    throw error;
  }

  revalidateTournamentPages();
  return { success: "Invitation sent." };
}

export async function respondToTeamInvite(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before responding to an invite." };
  }

  const inviteId = teamIdSchema.safeParse(formString(formData, "inviteId"));
  const decision = formString(formData, "decision");
  if (!inviteId.success || (decision !== "accepted" && decision !== "declined")) {
    return { code: "VALIDATION_ERROR", error: "Choose whether to accept or decline the invite." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [invite] = await tx
        .select({
          id: teamInvites.id,
          teamId: teamInvites.teamId,
          invitedRegistrationId: teamInvites.invitedRegistrationId,
          status: teamInvites.status,
          teamStatus: teams.status,
          invitedUserId: tournamentParticipants.userId,
        })
        .from(teamInvites)
        .innerJoin(teams, eq(teamInvites.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamInvites.invitedRegistrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(teamInvites.id, inviteId.data))
        .for("update")
        .limit(1);
      if (!invite || invite.status !== "pending") {
        throw new TournamentActionError("NOT_FOUND", "That invitation is no longer pending.");
      }
      if (invite.invitedUserId !== session.user.id) {
        throw new TournamentActionError("FORBIDDEN", "That invitation belongs to another participant.");
      }
      if (invite.teamStatus !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams cannot accept invitations.");
      }

      await tx
        .update(teamInvites)
        .set({ status: decision, respondedAt: new Date() })
        .where(eq(teamInvites.id, invite.id));

      if (decision === "accepted") {
        const [currentMembership] = await tx
          .select({ id: teamMembers.id })
          .from(teamMembers)
          .where(eq(teamMembers.registrationId, invite.invitedRegistrationId))
          .limit(1);
        if (currentMembership) {
          throw new TournamentActionError("ALREADY_ON_TEAM", "You have already joined another team.");
        }
        const members = await tx
          .select({ registrationId: teamMembers.registrationId })
          .from(teamMembers)
          .where(eq(teamMembers.teamId, invite.teamId));
        if (members.length >= 7) {
          throw new TournamentActionError("TEAM_FULL", "That team reached seven members before you accepted.");
        }

        await tx.insert(teamMembers).values({
          teamId: invite.teamId,
          registrationId: invite.invitedRegistrationId,
          isCaptain: false,
          lineupPosition: "substitute",
          starterRole: null,
        });
        await tx
          .update(teamInvites)
          .set({ status: "revoked", respondedAt: new Date() })
          .where(
            and(
              eq(teamInvites.invitedRegistrationId, invite.invitedRegistrationId),
              eq(teamInvites.status, "pending"),
            ),
          );
        await tx
          .update(teamJoinRequests)
          .set({ status: "revoked", respondedAt: new Date() })
          .where(
            and(
              eq(teamJoinRequests.registrationId, invite.invitedRegistrationId),
              eq(teamJoinRequests.status, "pending"),
            ),
          );
      }

      const [captain] = await tx
        .select({ userId: tournamentParticipants.userId })
        .from(teamInvites)
        .innerJoin(
          playerRegistrations,
          eq(teamInvites.invitedByRegistrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(teamInvites.id, invite.id))
        .limit(1);
      if (captain && captain.userId !== session.user.id) {
        await tx.insert(notifications).values({
          userId: captain.userId,
          type: "team_invite_decision",
          message:
            decision === "accepted"
              ? "A player accepted your team invitation."
              : "A player declined your team invitation.",
        });
      }
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "You joined another team first." };
    }
    throw error;
  }

  revalidateTournamentPages();
  return { success: decision === "accepted" ? "You joined the team." : "Invitation declined." };
}

export async function renameTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before renaming a team." };
  }
  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const teamName = teamNameSchema.safeParse(formString(formData, "teamName"));
  if (!teamId.success || !teamName.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a team name between 2 and 60 characters." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }
      const [captain] = await tx
        .select({ teamStatus: teams.status })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, teamId.data),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!captain) {
        throw new TournamentActionError("NOT_TEAM_CAPTAIN", "Only the team captain can rename this team.");
      }
      if (captain.teamStatus !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams are locked for participants.");
      }
      await tx
        .update(teams)
        .set({ name: teamName.data, updatedAt: new Date() })
        .where(eq(teams.id, teamId.data));
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "That team name is already taken." };
    }
    throw error;
  }
  revalidateTournamentPages();
  return { success: "Team renamed." };
}

export async function transferTeamCaptaincy(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before transferring captaincy." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const registrationId = teamIdSchema.safeParse(
    formString(formData, "registrationId"),
  );
  if (!teamId.success || !registrationId.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a current team member." };
  }

  try {
    const nextCaptainName = await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError(
          "DEADLINE_PASSED",
          "Team changes are closed because the deadline has passed.",
        );
      }

      const [team] = await tx
        .select({ id: teams.id, name: teams.name, status: teams.status })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new TournamentActionError("NOT_FOUND", "That team no longer exists.");
      }
      if (team.status !== "draft") {
        throw new TournamentActionError(
          "CONFLICT",
          "Ask the organizer to unlock the submitted team first.",
        );
      }

      const [captain] = await tx
        .select({
          memberId: teamMembers.id,
          registrationId: teamMembers.registrationId,
        })
        .from(teamMembers)
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!captain) {
        throw new TournamentActionError(
          "NOT_TEAM_CAPTAIN",
          "Only the current captain can transfer captaincy.",
        );
      }
      if (captain.registrationId === registrationId.data) {
        throw new TournamentActionError(
          "VALIDATION_ERROR",
          "Choose another team member as captain.",
        );
      }

      const [nextCaptain] = await tx
        .select({
          memberId: teamMembers.id,
          userId: tournamentParticipants.userId,
          displayName: users.displayName,
        })
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
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.registrationId, registrationId.data),
          ),
        )
        .limit(1);
      if (!nextCaptain) {
        throw new TournamentActionError(
          "NOT_FOUND",
          "That player is no longer on this team.",
        );
      }

      await tx
        .update(teamMembers)
        .set({ isCaptain: false })
        .where(eq(teamMembers.id, captain.memberId));
      await tx
        .update(teamMembers)
        .set({ isCaptain: true })
        .where(eq(teamMembers.id, nextCaptain.memberId));
      await tx
        .update(teams)
        .set({ updatedAt: new Date() })
        .where(eq(teams.id, team.id));
      await tx.insert(notifications).values({
        userId: nextCaptain.userId,
        type: "captaincy_transferred",
        message: `You are now the captain of ${team.name}.`,
      });

      return nextCaptain.displayName;
    });

    revalidateTournamentPages();
    return { success: `Captaincy transferred to ${nextCaptainName}.` };
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }
}

export async function deleteTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before deleting a team." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  if (!teamId.success) {
    return { code: "VALIDATION_ERROR", error: "The team could not be found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError(
          "DEADLINE_PASSED",
          "Team changes are closed because the deadline has passed.",
        );
      }

      const [team] = await tx
        .select({ id: teams.id, status: teams.status })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new TournamentActionError("NOT_FOUND", "That team no longer exists.");
      }
      if (team.status !== "draft") {
        throw new TournamentActionError(
          "CONFLICT",
          "Ask the organizer to unlock the submitted team first.",
        );
      }

      const [captain] = await tx
        .select({ memberId: teamMembers.id })
        .from(teamMembers)
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, team.id),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!captain) {
        throw new TournamentActionError(
          "NOT_TEAM_CAPTAIN",
          "Only the team captain can delete this team.",
        );
      }

      const members = await tx
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      if (members.length !== 1) {
        throw new TournamentActionError(
          "CONFLICT",
          "Transfer captaincy and leave instead. Teams with other members cannot be deleted.",
        );
      }

      await tx.delete(teams).where(eq(teams.id, team.id));
    });

    revalidateTournamentPages();
    return { success: "Team deleted." };
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }
}

export async function leaveTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before leaving a team." };
  }
  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  if (!teamId.success) {
    return { code: "VALIDATION_ERROR", error: "The team could not be found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }
      const [team] = await tx
        .select({ id: teams.id, status: teams.status })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new TournamentActionError("NOT_FOUND", "That team no longer exists.");
      }
      const [membership] = await tx
        .select({
          memberId: teamMembers.id,
          isCaptain: teamMembers.isCaptain,
        })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(eq(teamMembers.teamId, teamId.data), eq(tournamentParticipants.userId, session.user.id)),
        )
        .limit(1);
      if (!membership) {
        throw new TournamentActionError("FORBIDDEN", "You are not a member of this team.");
      }
      if (team.status !== "draft") {
        throw new TournamentActionError(
          "CONFLICT",
          "Ask the organizer to unlock the submitted team first.",
        );
      }
      if (membership.isCaptain) {
        throw new TournamentActionError(
          "CONFLICT",
          "Transfer captaincy before leaving, or delete the team if you are its only member.",
        );
      }

      await tx.delete(teamMembers).where(eq(teamMembers.id, membership.memberId));
      await tx
        .update(teams)
        .set({ updatedAt: new Date() })
        .where(eq(teams.id, teamId.data));
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }
  revalidateTournamentPages();
  return { success: "You left the team." };
}

export async function markNotificationRead(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before updating notifications." };
  }
  const notificationId = teamIdSchema.safeParse(formString(formData, "notificationId"));
  if (!notificationId.success) {
    return { code: "VALIDATION_ERROR", error: "That notification could not be found." };
  }

  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(
        eq(notifications.id, notificationId.data),
        eq(notifications.userId, session.user.id),
      ),
    );
  revalidatePath("/tournament");
  return { success: "Notification marked as read." };
}

export async function markAllNotificationsRead(
  _previousState: TournamentActionState,
  _formData: FormData,
): Promise<TournamentActionState> {
  void _previousState;
  void _formData;
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before updating notifications." };
  }

  await db
    .update(notifications)
    .set({ status: "read", readAt: new Date() })
    .where(
      and(
        eq(notifications.userId, session.user.id),
        eq(notifications.status, "unread"),
      ),
    );
  revalidatePath("/tournament");
  return { success: "Notifications marked as read." };
}

export async function updateTeamLineup(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before editing a lineup." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const lineupValue = formString(formData, "lineup");
  if (!teamId.success || !lineupValue) {
    return { code: "VALIDATION_ERROR", error: "The lineup could not be read." };
  }

  let parsedLineup: unknown;
  try {
    parsedLineup = JSON.parse(lineupValue);
  } catch {
    return { code: "VALIDATION_ERROR", error: "The lineup could not be read." };
  }
  const lineup = lineupSchema.safeParse(parsedLineup);
  if (!lineup.success) {
    return { code: "VALIDATION_ERROR", error: "Assign every member to a starter or substitute slot." };
  }

  try {
    await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team changes are closed because the deadline has passed.");
      }

      const [captain] = await tx
        .select({ registrationId: teamMembers.registrationId, teamStatus: teams.status })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, teamId.data),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .limit(1);
      if (!captain) {
        throw new TournamentActionError("NOT_TEAM_CAPTAIN", "Only the team captain can edit the lineup.");
      }
      if (captain.teamStatus !== "draft") {
        throw new TournamentActionError("CONFLICT", "Submitted teams are locked for participants.");
      }

      const members = await tx
        .select({ registrationId: teamMembers.registrationId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, teamId.data));
      const memberIds = new Set(members.map((member) => member.registrationId));
      const lineupIds = lineup.data.map((entry) => entry.registrationId);
      if (
        lineup.data.length !== members.length ||
        new Set(lineupIds).size !== lineupIds.length ||
        lineupIds.some((id) => !memberIds.has(id))
      ) {
        throw new TournamentActionError("ROSTER_INVALID", "Assign every current team member exactly once.");
      }

      const starters = lineup.data.filter((entry) => entry.lineupPosition === "starter");
      const substitutes = lineup.data.filter((entry) => entry.lineupPosition === "substitute");
      if (starters.length > 5 || substitutes.length > 2) {
        throw new TournamentActionError("ROSTER_INVALID", "A team can have five starters and up to two substitutes.");
      }
      if (
        starters.some((entry) => !entry.starterRole) ||
        substitutes.some((entry) => entry.starterRole)
      ) {
        throw new TournamentActionError("ROSTER_INVALID", "Starter roles and lineup positions do not match.");
      }
      if (
        new Set(starters.map((entry) => entry.starterRole)).size !== starters.length
      ) {
        throw new TournamentActionError("ROSTER_INVALID", "Each starter role can only be assigned once.");
      }

      await tx
        .update(teamMembers)
        .set({ lineupPosition: "substitute", starterRole: null })
        .where(eq(teamMembers.teamId, teamId.data));
      for (const entry of lineup.data) {
        await tx
          .update(teamMembers)
          .set({
            lineupPosition: entry.lineupPosition,
            starterRole: entry.starterRole,
          })
          .where(
            and(
              eq(teamMembers.teamId, teamId.data),
              eq(teamMembers.registrationId, entry.registrationId),
            ),
          );
      }
      await tx
        .update(teams)
        .set({ updatedAt: new Date() })
        .where(eq(teams.id, teamId.data));
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }

  revalidateTournamentPages();
  return { success: "Lineup saved." };
}

export async function submitTeam(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before submitting a team." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  if (!teamId.success) {
    return { code: "VALIDATION_ERROR", error: "The team could not be found." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [settings] = await tx
        .select({ registrationDeadline: tournamentSettings.registrationDeadline })
        .from(tournamentSettings)
        .where(eq(tournamentSettings.id, 1))
        .limit(1);
      if (!settings || deadlinePassed(settings.registrationDeadline)) {
        throw new TournamentActionError("DEADLINE_PASSED", "Team submissions are closed because the deadline has passed.");
      }

      const [captain] = await tx
        .select({ teamStatus: teams.status })
        .from(teamMembers)
        .innerJoin(teams, eq(teamMembers.teamId, teams.id))
        .innerJoin(
          playerRegistrations,
          eq(teamMembers.registrationId, playerRegistrations.id),
        )
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(
          and(
            eq(teamMembers.teamId, teamId.data),
            eq(teamMembers.isCaptain, true),
            eq(tournamentParticipants.userId, session.user.id),
          ),
        )
        .for("update")
        .limit(1);
      if (!captain) {
        throw new TournamentActionError("NOT_TEAM_CAPTAIN", "Only the team captain can submit a team.");
      }
      if (captain.teamStatus === "submitted") {
        throw new TournamentActionError("CONFLICT", "This team has already been submitted.");
      }

      const rows = await tx
        .select({
          member: teamMembers,
          registration: playerRegistrations,
          user: users,
        })
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
        .where(eq(teamMembers.teamId, teamId.data))
        .orderBy(asc(teamMembers.joinedAt));

      const validation = validateRoster(
        rows.map(({ member, registration, user }) => ({
          displayName: user.displayName,
          approvedTier: registration.approvedTier,
          lineupPosition: member.lineupPosition,
          starterRole: member.starterRole,
          primaryRole: registration.primaryRole,
          secondaryRole: registration.secondaryRole,
        })),
      );
      if (!validation.valid) {
        return {
          blockingIssues: validation.blockingIssues,
          warnings: validation.warnings,
        };
      }

      await tx
        .update(teams)
        .set({ status: "submitted", submittedAt: new Date(), updatedAt: new Date() })
        .where(eq(teams.id, teamId.data));
      await tx.insert(notifications).values({
        userId: session.user.id,
        type: "team_submitted",
        message: "Your team roster was submitted for organizer review.",
      });

      return { blockingIssues: [], warnings: validation.warnings };
    });

    if (result.blockingIssues.length > 0) {
      return {
        code: "ROSTER_INVALID",
        error: "Fix the blocking roster issues before submitting.",
        blockingIssues: result.blockingIssues,
        warnings: result.warnings,
      };
    }

    revalidateTournamentPages();
    return {
      success: "Team submitted.",
      warnings: result.warnings,
    };
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }
}

export async function approveRegistrationTier(
  _previousState: TournamentActionState,
  formData: FormData,
): Promise<TournamentActionState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before reviewing tiers." };
  }
  if (session.user.role !== "organizer") {
    return { code: "FORBIDDEN", error: "Only the organizer can approve tiers." };
  }

  const [organizerParticipant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .where(eq(tournamentParticipants.userId, session.user.id))
    .limit(1);
  if (!organizerParticipant) {
    return {
      code: "TOURNAMENT_ACCESS_REQUIRED",
      error: "Join this tournament before reviewing tiers.",
    };
  }

  const registrationId = formString(formData, "registrationId");
  const approvedTier = tierSchema.safeParse(formString(formData, "approvedTier"));
  if (!registrationId || !approvedTier.success) {
    return { code: "VALIDATION_ERROR", error: "Choose an approved tier before saving." };
  }

  try {
    await db.transaction(async (tx) => {
      const [registration] = await tx
        .select({
          id: playerRegistrations.id,
          userId: tournamentParticipants.userId,
          approvedTier: playerRegistrations.approvedTier,
        })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(playerRegistrations.id, registrationId))
        .for("update")
        .limit(1);
      if (!registration) {
        throw new TournamentActionError("NOT_FOUND", "That registration could not be found.");
      }

      await tx
        .update(playerRegistrations)
        .set({
          approvedTier: approvedTier.data,
          tierStatus: "approved",
          updatedAt: new Date(),
        })
        .where(eq(playerRegistrations.id, registration.id));

      const [membership] = await tx
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.registrationId, registration.id))
        .limit(1);
      if (membership) {
        const [team] = await tx
          .select({ id: teams.id, status: teams.status })
          .from(teams)
          .where(eq(teams.id, membership.teamId))
          .limit(1);
        if (team?.status === "submitted") {
          const rows = await tx
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
            .where(eq(teamMembers.teamId, team.id));
          const validation = validateRoster(
            rows.map(({ member, registration: current, user }) => ({
              displayName: user.displayName,
              approvedTier: current.approvedTier,
              lineupPosition: member.lineupPosition,
              starterRole: member.starterRole,
              primaryRole: current.primaryRole,
              secondaryRole: current.secondaryRole,
            })),
          );
          if (!validation.valid) {
            await tx
              .update(teams)
              .set({ status: "draft", submittedAt: null, updatedAt: new Date() })
              .where(eq(teams.id, team.id));
            const [captain] = await tx
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
              .where(and(eq(teamMembers.teamId, team.id), eq(teamMembers.isCaptain, true)))
              .limit(1);
            if (captain) {
              await tx.insert(notifications).values({
                userId: captain.userId,
                type: "team_reopened",
                message: "Your submitted team returned to draft after a tier review.",
              });
            }
          }
        }
      }

      await tx.insert(notifications).values({
        userId: registration.userId,
        type: "tier_review",
        message: `Your tournament tier was approved as ${approvedTier.data}.`,
      });
    });
  } catch (error) {
    if (error instanceof TournamentActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }

  revalidateTournamentPages();
  return {
    success: `Tier approved as ${approvedTier.data}.`,
  };
}

class TournamentActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "TournamentActionError";
  }
}
