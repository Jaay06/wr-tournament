import { and, asc, desc, eq, inArray, isNotNull, isNull, or } from "drizzle-orm";

import { db } from "@/db";
import {
  playerRegistrations,
  passwordResetTokens,
  teamInvites,
  teamJoinRequests,
  tournamentParticipants,
  tournamentSettings,
  users,
} from "@/db/schema";

export type SoftDeleteUserResult =
  | {
      status: "not_found";
      email: string;
    }
  | {
      status: "already_deleted";
      email: string;
      userId: string;
      deletedAt: Date;
    }
  | {
      status: "deleted";
      email: string;
      userId: string;
      deletedAt: Date;
      revokedInviteCount: number;
      revokedJoinRequestCount: number;
    };

export class UserAccountError extends Error {}

export async function softDeleteUserByEmail(
  rawEmail: string,
): Promise<SoftDeleteUserResult> {
  const email = rawEmail.trim().toLowerCase();

  if (!email) {
    throw new UserAccountError("An email address is required.");
  }

  return db.transaction(async (tx) => {
    const [activeUser] = await tx
      .select({
        id: users.id,
        email: users.email,
        role: users.role,
      })
      .from(users)
      .where(and(eq(users.email, email), isNull(users.deletedAt)))
      .for("update")
      .limit(1);

    if (!activeUser) {
      const [deletedUser] = await tx
        .select({
          id: users.id,
          email: users.email,
          deletedAt: users.deletedAt,
        })
        .from(users)
        .where(and(eq(users.email, email), isNotNull(users.deletedAt)))
        .orderBy(desc(users.deletedAt), asc(users.createdAt))
        .limit(1);

      return deletedUser?.deletedAt
        ? {
            status: "already_deleted" as const,
            email,
            userId: deletedUser.id,
            deletedAt: deletedUser.deletedAt,
          }
        : { status: "not_found" as const, email };
    }

    if (activeUser.role === "organizer") {
      throw new UserAccountError(
        "Refusing to soft-delete the organizer account. Transfer organizer ownership first.",
      );
    }

    const [settingsOwned] = await tx
      .select({ id: tournamentSettings.id })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.updatedBy, activeUser.id))
      .limit(1);

    if (settingsOwned) {
      throw new UserAccountError(
        "Refusing to soft-delete an account that owns tournament settings.",
      );
    }

    const registrations = await tx
      .select({ id: playerRegistrations.id })
      .from(playerRegistrations)
      .innerJoin(
        tournamentParticipants,
        eq(playerRegistrations.participantId, tournamentParticipants.id),
      )
      .where(eq(tournamentParticipants.userId, activeUser.id));
    const registrationIds = registrations.map(({ id }) => id);
    const now = new Date();

    let revokedInviteCount = 0;
    let revokedJoinRequestCount = 0;

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, activeUser.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    if (registrationIds.length > 0) {
      const revokedInvites = await tx
        .update(teamInvites)
        .set({ status: "revoked", respondedAt: now })
        .where(
          and(
            eq(teamInvites.status, "pending"),
            or(
              inArray(teamInvites.invitedRegistrationId, registrationIds),
              inArray(teamInvites.invitedByRegistrationId, registrationIds),
            ),
          ),
        )
        .returning({ id: teamInvites.id });
      revokedInviteCount = revokedInvites.length;

      const revokedJoinRequests = await tx
        .update(teamJoinRequests)
        .set({ status: "revoked", respondedAt: now })
        .where(
          and(
            eq(teamJoinRequests.status, "pending"),
            inArray(teamJoinRequests.registrationId, registrationIds),
          ),
        )
        .returning({ id: teamJoinRequests.id });
      revokedJoinRequestCount = revokedJoinRequests.length;
    }

    const [deletedUser] = await tx
      .update(users)
      .set({ deletedAt: now, updatedAt: now })
      .where(and(eq(users.id, activeUser.id), isNull(users.deletedAt)))
      .returning({ id: users.id, email: users.email, deletedAt: users.deletedAt });

    if (!deletedUser?.deletedAt) {
      throw new UserAccountError(
        "The account changed before it could be soft-deleted. Try again.",
      );
    }

    return {
      status: "deleted" as const,
      email,
      userId: deletedUser.id,
      deletedAt: deletedUser.deletedAt,
      revokedInviteCount,
      revokedJoinRequestCount,
    };
  });
}

export function activeUserCondition() {
  return isNull(users.deletedAt);
}
