import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

export const accountRole = pgEnum("account_role", ["user", "organizer"]);
export const tier = pgEnum("tier", ["T1", "T2", "T3", "T4"]);
export const tierStatus = pgEnum("tier_status", ["pending", "approved"]);
export const wildRiftRole = pgEnum("wild_rift_role", [
  "Baron",
  "Jungle",
  "Mid",
  "Dragon",
  "Support",
]);
export const teamStatus = pgEnum("team_status", ["draft", "submitted"]);
export const lineupPosition = pgEnum("lineup_position", [
  "starter",
  "substitute",
]);
export const requestStatus = pgEnum("request_status", [
  "pending",
  "accepted",
  "declined",
  "revoked",
]);
export const notificationStatus = pgEnum("notification_status", [
  "unread",
  "read",
]);

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email"),
    discordId: text("discord_id"),
    passwordHash: text("password_hash"),
    displayName: text("display_name").notNull(),
    avatarUrl: text("avatar_url"),
    role: accountRole("role").default("user").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    uniqueIndex("users_discord_id_unique").on(table.discordId),
    check(
      "users_identity_check",
      sql`${table.email} is not null or ${table.discordId} is not null`,
    ),
  ],
);

export const tournamentSettings = pgTable(
  "tournament_settings",
  {
    id: integer("id").default(1).primaryKey(),
    name: text("name").notNull(),
    region: text("region").notNull(),
    inviteCodeHash: text("invite_code_hash").notNull(),
    inviteEnabled: boolean("invite_enabled").default(true).notNull(),
    registrationDeadline: timestamp("registration_deadline", {
      withTimezone: true,
    }),
    updatedBy: uuid("updated_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check("tournament_settings_singleton_check", sql`${table.id} = 1`),
  ],
);

export const tournamentParticipants = pgTable(
  "tournament_participants",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("tournament_participants_user_unique").on(table.userId),
  ],
);

export const playerRegistrations = pgTable(
  "player_registrations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    participantId: uuid("participant_id")
      .notNull()
      .references(() => tournamentParticipants.id, { onDelete: "restrict" }),
    riotName: text("riot_name").notNull(),
    riotTag: text("riot_tag").notNull(),
    currentRank: text("current_rank").notNull(),
    selfAssessedTier: tier("self_assessed_tier").notNull(),
    approvedTier: tier("approved_tier"),
    tierStatus: tierStatus("tier_status").default("pending").notNull(),
    primaryRole: wildRiftRole("primary_role").notNull(),
    secondaryRole: wildRiftRole("secondary_role").notNull(),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("player_registrations_participant_unique").on(
      table.participantId,
    ),
    check(
      "player_registrations_tier_status_check",
      sql`(${table.tierStatus} = 'pending' and ${table.approvedTier} is null) or (${table.tierStatus} = 'approved' and ${table.approvedTier} is not null)`,
    ),
    check(
      "player_registrations_distinct_roles_check",
      sql`${table.primaryRole} <> ${table.secondaryRole}`,
    ),
  ],
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    name: text("name").notNull(),
    status: teamStatus("status").default("draft").notNull(),
    submittedAt: timestamp("submitted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [uniqueIndex("teams_name_unique").on(table.name)],
);

export const teamMembers = pgTable(
  "team_members",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    isCaptain: boolean("is_captain").default(false).notNull(),
    lineupPosition: lineupPosition("lineup_position").notNull(),
    starterRole: wildRiftRole("starter_role"),
    joinedAt: timestamp("joined_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("team_members_registration_unique").on(table.registrationId),
    uniqueIndex("team_members_team_starter_role_unique").on(
      table.teamId,
      table.starterRole,
    ),
    uniqueIndex("team_members_one_captain_unique")
      .on(table.teamId)
      .where(sql`${table.isCaptain} = true`),
    check(
      "team_members_lineup_role_check",
      sql`(${table.lineupPosition} = 'starter' and ${table.starterRole} is not null) or (${table.lineupPosition} = 'substitute' and ${table.starterRole} is null)`,
    ),
  ],
);

export const teamInvites = pgTable(
  "team_invites",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    invitedRegistrationId: uuid("invited_registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    invitedByRegistrationId: uuid("invited_by_registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    status: requestStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    index("team_invites_invited_registration_idx").on(
      table.invitedRegistrationId,
    ),
    uniqueIndex("team_invites_pending_unique")
      .on(table.teamId, table.invitedRegistrationId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const teamJoinRequests = pgTable(
  "team_join_requests",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    status: requestStatus("status").default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    respondedAt: timestamp("responded_at", { withTimezone: true }),
  },
  (table) => [
    index("team_join_requests_registration_idx").on(table.registrationId),
    uniqueIndex("team_join_requests_pending_unique")
      .on(table.teamId, table.registrationId)
      .where(sql`${table.status} = 'pending'`),
  ],
);

export const announcements = pgTable("announcements", {
  id: uuid("id").defaultRandom().primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  createdBy: uuid("created_by")
    .notNull()
    .references(() => users.id, { onDelete: "restrict" }),
  ...timestamps,
});

export const notifications = pgTable(
  "notifications",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    type: text("type").notNull(),
    message: text("message").notNull(),
    status: notificationStatus("status").default("unread").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    readAt: timestamp("read_at", { withTimezone: true }),
  },
  (table) => [
    index("notifications_user_status_idx").on(table.userId, table.status),
  ],
);

export const passwordResetTokens = pgTable(
  "password_reset_tokens",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    tokenHash: text("token_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    usedAt: timestamp("used_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("password_reset_tokens_hash_unique").on(table.tokenHash),
    index("password_reset_tokens_user_idx").on(table.userId),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type NewPlayerRegistration = typeof playerRegistrations.$inferInsert;
