"use server";

import { revalidatePath } from "next/cache";
import { and, asc, eq } from "drizzle-orm";

import { auth } from "@/auth";
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
  tournamentSettings,
  users,
} from "@/db/schema";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/tournament";
import { validateRoster } from "@/lib/tournament-rules";
import type { TournamentMemberData } from "@/lib/tournament-types";
import {
  announcementSchema,
  lineupSchema,
  organizerSettingsSchema,
  teamIdSchema,
} from "@/lib/validation";

export type SettingsState = {
  error?: string;
  success?: string;
};

export type InviteCodeState = {
  code?: string;
  error?: string;
};

export type AnnouncementState = {
  error?: string;
  success?: string;
};

export type TeamAdminState = {
  code?: string;
  error?: string;
  success?: string;
  blockingIssues?: string[];
  warnings?: string[];
};

function formString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : undefined;
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
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/teams");
  revalidatePath("/invite");
  revalidatePath("/tournament");
  revalidatePath("/tournament/register");
  revalidatePath("/tournament/team");
  revalidatePath("/tournament/teams");
}

export async function updateTournamentSettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before changing tournament settings." };
  }

  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can change tournament settings." };
  }

  const parsed = organizerSettingsSchema.safeParse({
    name: formString(formData, "name"),
    region: formString(formData, "region"),
    registrationDeadline:
      formString(formData, "registrationDeadline")?.trim() || undefined,
    inviteEnabled: formString(formData, "inviteEnabled") === "on",
  });

  if (!parsed.success) {
    return { error: "Enter a tournament name and region before saving." };
  }

  let registrationDeadline: Date | null = null;

  if (parsed.data.registrationDeadline) {
    registrationDeadline = new Date(parsed.data.registrationDeadline);

    if (Number.isNaN(registrationDeadline.getTime())) {
      return { error: "Enter a valid registration deadline." };
    }
  }

  const [settings] = await db
    .select({ id: tournamentSettings.id })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return { error: "Run the tournament setup command before editing settings." };
  }

  await db
    .update(tournamentSettings)
    .set({
      name: parsed.data.name,
      region: parsed.data.region,
      inviteEnabled: parsed.data.inviteEnabled,
      registrationDeadline,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(tournamentSettings.id, 1));

  revalidateTournamentPages();

  return { success: "Tournament settings saved." };
}

export async function generateTournamentInvite(
  _previousState: InviteCodeState,
): Promise<InviteCodeState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before generating an invite." };
  }

  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can generate an invite." };
  }

  const [settings] = await db
    .select({ id: tournamentSettings.id })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return { error: "Run the tournament setup command before generating an invite." };
  }

  const code = generateInviteCode();

  await db
    .update(tournamentSettings)
    .set({
      inviteCodeHash: hashInviteCode(code),
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(tournamentSettings.id, 1));

  revalidateTournamentPages();

  return { code };
}

export async function createAnnouncement(
  _previousState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in before posting an announcement." };
  }
  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can post announcements." };
  }

  const parsed = announcementSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
  });
  if (!parsed.success) {
    return { error: "Add a title and message before posting." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(announcements).values({
      title: parsed.data.title,
      body: parsed.data.body,
      createdBy: session.user.id,
    });

    const participants = await tx
      .select({ userId: tournamentParticipants.userId })
      .from(tournamentParticipants);
    if (participants.length > 0) {
      await tx.insert(notifications).values(
        participants.map(({ userId }) => ({
          userId,
          type: "announcement",
          message: parsed.data.title,
        })),
      );
    }
  });

  revalidateTournamentPages();
  return { success: "Announcement posted." };
}

export async function deleteAnnouncement(
  _previousState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in before deleting an announcement." };
  }
  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can delete announcements." };
  }

  const id = formString(formData, "id");
  if (!id) {
    return { error: "That announcement could not be found." };
  }

  await db.delete(announcements).where(eq(announcements.id, id));
  revalidateTournamentPages();
  return { success: "Announcement deleted." };
}

function validationMember(
  member: typeof teamMembers.$inferSelect,
  registration: typeof playerRegistrations.$inferSelect,
  user: typeof users.$inferSelect,
): Pick<
  TournamentMemberData,
  | "displayName"
  | "approvedTier"
  | "lineupPosition"
  | "starterRole"
  | "primaryRole"
  | "secondaryRole"
> {
  return {
    displayName: user.displayName,
    approvedTier: registration.approvedTier,
    lineupPosition: member.lineupPosition,
    starterRole: member.starterRole,
    primaryRole: registration.primaryRole,
    secondaryRole: registration.secondaryRole,
  };
}

function parseLineup(formData: FormData) {
  const value = formString(formData, "lineup");
  if (!value) {
    return { error: "The lineup could not be read." } as const;
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch {
    return { error: "The lineup could not be read." } as const;
  }

  const result = lineupSchema.safeParse(parsed);
  return result.success
    ? { lineup: result.data }
    : { error: "Assign every member to a starter or substitute slot." };
}

export async function unlockSubmittedTeam(
  _previousState: TeamAdminState,
  formData: FormData,
): Promise<TeamAdminState> {
  void _previousState;
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before changing team status." };
  }
  if (session.user.role !== "organizer") {
    return { code: "FORBIDDEN", error: "Only the organizer can change team status." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  if (!teamId.success) {
    return { code: "VALIDATION_ERROR", error: "That team could not be found." };
  }

  try {
    await db.transaction(async (tx) => {
      const [team] = await tx
        .select({ id: teams.id, name: teams.name, status: teams.status })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new AdminTeamActionError("NOT_FOUND", "That team no longer exists.");
      }
      if (team.status === "draft") {
        return;
      }

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
          type: "team_unlocked",
          message: `${team.name} was returned to draft by the organizer.`,
        });
      }
    });
  } catch (error) {
    if (error instanceof AdminTeamActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }

  revalidateTournamentPages();
  return { success: "Team unlocked for editing." };
}

export async function organizerUpdateTeamLineup(
  _previousState: TeamAdminState,
  formData: FormData,
): Promise<TeamAdminState> {
  void _previousState;
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before repairing a lineup." };
  }
  if (session.user.role !== "organizer") {
    return { code: "FORBIDDEN", error: "Only the organizer can repair lineups." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const parsedLineup = parseLineup(formData);
  if (!teamId.success) {
    return {
      code: "VALIDATION_ERROR",
      error: "That team could not be found.",
    };
  }
  if ("error" in parsedLineup) {
    return { code: "VALIDATION_ERROR", error: parsedLineup.error };
  }
  const lineup = parsedLineup.lineup;

  try {
    const result = await db.transaction(async (tx) => {
      const [team] = await tx
        .select({ id: teams.id, status: teams.status, name: teams.name })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new AdminTeamActionError("NOT_FOUND", "That team no longer exists.");
      }

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
        .where(eq(teamMembers.teamId, team.id))
        .orderBy(asc(teamMembers.joinedAt));

      const memberIds = new Set(rows.map(({ member }) => member.registrationId));
      const lineupIds = lineup.map((entry) => entry.registrationId);
      if (
        lineup.length !== rows.length ||
        new Set(lineupIds).size !== lineupIds.length ||
        lineupIds.some((id) => !memberIds.has(id))
      ) {
        throw new AdminTeamActionError(
          "ROSTER_INVALID",
          "Assign every current team member exactly once.",
        );
      }

      const starters = lineup.filter((entry) => entry.lineupPosition === "starter");
      const substitutes = lineup.filter(
        (entry) => entry.lineupPosition === "substitute",
      );
      if (starters.length > 5 || substitutes.length > 2) {
        throw new AdminTeamActionError(
          "ROSTER_INVALID",
          "A team can have five starters and up to two substitutes.",
        );
      }
      if (
        starters.some((entry) => !entry.starterRole) ||
        substitutes.some((entry) => entry.starterRole)
      ) {
        throw new AdminTeamActionError(
          "ROSTER_INVALID",
          "Starter roles and lineup positions do not match.",
        );
      }
      if (
        new Set(starters.map((entry) => entry.starterRole)).size !== starters.length
      ) {
        throw new AdminTeamActionError(
          "ROSTER_INVALID",
          "Each starter role can only be assigned once.",
        );
      }

      await tx
        .update(teamMembers)
        .set({ lineupPosition: "substitute", starterRole: null })
        .where(eq(teamMembers.teamId, team.id));
      for (const entry of lineup) {
        await tx
          .update(teamMembers)
          .set({
            lineupPosition: entry.lineupPosition,
            starterRole: entry.starterRole,
          })
          .where(
            and(
              eq(teamMembers.teamId, team.id),
              eq(teamMembers.registrationId, entry.registrationId),
            ),
          );
      }

      const lineupByRegistration = new Map(
        lineup.map((entry) => [entry.registrationId, entry]),
      );
      const validation = validateRoster(
        rows.map(({ member, registration, user }) => {
          const entry = lineupByRegistration.get(member.registrationId);
          return validationMember(
            {
              ...member,
              lineupPosition: entry?.lineupPosition ?? member.lineupPosition,
              starterRole: entry ? entry.starterRole : member.starterRole,
            },
            registration,
            user,
          );
        }),
      );

      const reopened = team.status === "submitted" && !validation.valid;
      await tx
        .update(teams)
        .set(
          reopened
            ? { status: "draft", submittedAt: null, updatedAt: new Date() }
            : { updatedAt: new Date() },
        )
        .where(eq(teams.id, team.id));

      if (reopened) {
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
            message: `${team.name} was returned to draft after an organizer lineup repair.`,
          });
        }
      }

      return { validation, reopened };
    });

    revalidateTournamentPages();
    return {
      success: result.reopened
        ? "Lineup saved and team returned to draft."
        : "Lineup saved.",
      blockingIssues: result.validation.blockingIssues,
      warnings: result.validation.warnings,
    };
  } catch (error) {
    if (error instanceof AdminTeamActionError) {
      return {
        code: error.code,
        error: error.message,
      };
    }
    throw error;
  }
}

export async function addTeamMember(
  _previousState: TeamAdminState,
  formData: FormData,
): Promise<TeamAdminState> {
  void _previousState;
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before adding a team member." };
  }
  if (session.user.role !== "organizer") {
    return { code: "FORBIDDEN", error: "Only the organizer can repair rosters." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const registrationId = teamIdSchema.safeParse(
    formString(formData, "registrationId"),
  );
  if (!teamId.success || !registrationId.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a registered player and team." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [team] = await tx
        .select({ id: teams.id, name: teams.name, status: teams.status })
        .from(teams)
        .where(eq(teams.id, teamId.data))
        .for("update")
        .limit(1);
      if (!team) {
        throw new AdminTeamActionError("NOT_FOUND", "That team no longer exists.");
      }

      const members = await tx
        .select({ registrationId: teamMembers.registrationId })
        .from(teamMembers)
        .where(eq(teamMembers.teamId, team.id));
      if (members.length >= 7) {
        throw new AdminTeamActionError("TEAM_FULL", "A team can have no more than seven members.");
      }
      if (members.some((member) => member.registrationId === registrationId.data)) {
        throw new AdminTeamActionError("ALREADY_ON_TEAM", "That player is already on this team.");
      }

      const [target] = await tx
        .select({ id: playerRegistrations.id, userId: tournamentParticipants.userId })
        .from(playerRegistrations)
        .innerJoin(
          tournamentParticipants,
          eq(playerRegistrations.participantId, tournamentParticipants.id),
        )
        .where(eq(playerRegistrations.id, registrationId.data))
        .limit(1);
      if (!target) {
        throw new AdminTeamActionError("NOT_FOUND", "That participant is not registered.");
      }

      const [otherTeam] = await tx
        .select({ teamId: teamMembers.teamId })
        .from(teamMembers)
        .where(eq(teamMembers.registrationId, target.id))
        .limit(1);
      if (otherTeam) {
        throw new AdminTeamActionError("ALREADY_ON_TEAM", "That player already belongs to a team.");
      }

      await tx.insert(teamMembers).values({
        teamId: team.id,
        registrationId: target.id,
        isCaptain: false,
        lineupPosition: "substitute",
        starterRole: null,
      });
      await tx
        .update(teamJoinRequests)
        .set({ status: "revoked", respondedAt: new Date() })
        .where(
          and(
            eq(teamJoinRequests.registrationId, target.id),
            eq(teamJoinRequests.status, "pending"),
          ),
        );
      await tx
        .update(teamInvites)
        .set({ status: "revoked", respondedAt: new Date() })
        .where(
          and(
            eq(teamInvites.invitedRegistrationId, target.id),
            eq(teamInvites.status, "pending"),
          ),
        );

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

      if (team.status === "submitted") {
        await tx
          .update(teams)
          .set({ status: "draft", submittedAt: null, updatedAt: new Date() })
          .where(eq(teams.id, team.id));
      } else {
        await tx
          .update(teams)
          .set({ updatedAt: new Date() })
          .where(eq(teams.id, team.id));
      }

      await tx.insert(notifications).values({
        userId: target.userId,
        type: "team_added",
        message: `The organizer added you to ${team.name}.`,
      });
      if (captain && captain.userId !== target.userId) {
        await tx.insert(notifications).values({
          userId: captain.userId,
          type: "team_repaired",
          message: `${team.name} was updated by the organizer.`,
        });
      }

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
        .where(eq(teamMembers.teamId, team.id))
        .orderBy(asc(teamMembers.joinedAt));

      return validateRoster(
        rows.map(({ member, registration, user }) =>
          validationMember(member, registration, user),
        ),
      );
    });

    revalidateTournamentPages();
    return {
      success: "Player added as a substitute.",
      blockingIssues: result.blockingIssues,
      warnings: result.warnings,
    };
  } catch (error) {
    if (error instanceof AdminTeamActionError) {
      return { code: error.code, error: error.message };
    }
    if (isUniqueViolation(error)) {
      return { code: "CONFLICT", error: "That player joined another team first." };
    }
    throw error;
  }
}

export async function removeTeamMember(
  _previousState: TeamAdminState,
  formData: FormData,
): Promise<TeamAdminState> {
  void _previousState;
  const session = await auth();
  if (!session?.user?.id) {
    return { code: "UNAUTHENTICATED", error: "Sign in before removing a team member." };
  }
  if (session.user.role !== "organizer") {
    return { code: "FORBIDDEN", error: "Only the organizer can repair rosters." };
  }

  const teamId = teamIdSchema.safeParse(formString(formData, "teamId"));
  const registrationId = teamIdSchema.safeParse(
    formString(formData, "registrationId"),
  );
  if (!teamId.success || !registrationId.success) {
    return { code: "VALIDATION_ERROR", error: "Choose a current team member." };
  }

  try {
    const result = await db.transaction(async (tx) => {
      const [membership] = await tx
        .select({
          member: teamMembers,
          teamName: teams.name,
          teamStatus: teams.status,
          userId: tournamentParticipants.userId,
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
          and(
            eq(teamMembers.teamId, teamId.data),
            eq(teamMembers.registrationId, registrationId.data),
          ),
        )
        .for("update")
        .limit(1);
      if (!membership) {
        throw new AdminTeamActionError("NOT_FOUND", "That player is not on this team.");
      }
      if (membership.member.isCaptain) {
        throw new AdminTeamActionError(
          "CONFLICT",
          "Captaincy must be transferred before removing the captain.",
        );
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
        .where(and(eq(teamMembers.teamId, teamId.data), eq(teamMembers.isCaptain, true)))
        .limit(1);

      await tx.delete(teamMembers).where(eq(teamMembers.id, membership.member.id));
      await tx
        .update(teamJoinRequests)
        .set({ status: "revoked", respondedAt: new Date() })
        .where(
          and(
            eq(teamJoinRequests.registrationId, registrationId.data),
            eq(teamJoinRequests.status, "pending"),
          ),
        );
      await tx
        .update(teamInvites)
        .set({ status: "revoked", respondedAt: new Date() })
        .where(
          and(
            eq(teamInvites.invitedRegistrationId, registrationId.data),
            eq(teamInvites.status, "pending"),
          ),
        );

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
        .where(eq(teamMembers.teamId, teamId.data))
        .orderBy(asc(teamMembers.joinedAt));
      const validation = validateRoster(
        rows.map(({ member, registration, user }) =>
          validationMember(member, registration, user),
        ),
      );

      await tx
        .update(teams)
        .set(
          membership.teamStatus === "submitted"
            ? { status: "draft", submittedAt: null, updatedAt: new Date() }
            : { updatedAt: new Date() },
        )
        .where(eq(teams.id, teamId.data));

      await tx.insert(notifications).values({
        userId: membership.userId,
        type: "team_removed",
        message: `The organizer removed you from ${membership.teamName}.`,
      });
      if (captain) {
        await tx.insert(notifications).values({
          userId: captain.userId,
          type: "team_repaired",
          message: `${membership.teamName} was updated by the organizer.`,
        });
      }

      return {
        validation,
        reopened: membership.teamStatus === "submitted",
      };
    });

    revalidateTournamentPages();
    return {
      success: result.reopened
        ? "Player removed and team returned to draft."
        : "Player removed from the team.",
      blockingIssues: result.validation.blockingIssues,
      warnings: result.validation.warnings,
    };
  } catch (error) {
    if (error instanceof AdminTeamActionError) {
      return { code: error.code, error: error.message };
    }
    throw error;
  }
}

class AdminTeamActionError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "AdminTeamActionError";
  }
}
