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
export const draftStatus = pgEnum("draft_status", [
  "active",
  "paused",
  "completed",
  "needs_repair",
]);
export const draftPickSource = pgEnum("draft_pick_source", [
  "captain",
  "organizer",
  "auto",
]);
export const draftDirection = pgEnum("draft_direction", [
  "forward",
  "reverse",
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
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique")
      .on(table.email)
      .where(sql`${table.deletedAt} is null`),
    uniqueIndex("users_discord_id_unique")
      .on(table.discordId)
      .where(sql`${table.deletedAt} is null`),
    index("users_deleted_at_idx").on(table.deletedAt),
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
    teamRegistrationEnabled: boolean("team_registration_enabled")
      .default(true)
      .notNull(),
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

/**
 * A live captain snake draft. The session row is the authoritative scheduler
 * cursor. Every mutation that can affect a locked team or player must lock
 * this row before it changes roster data.
 */
export const draftSessions = pgTable(
  "draft_sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    status: draftStatus("status").default("active").notNull(),
    currentTier: tier("current_tier").default("T1").notNull(),
    currentRound: integer("current_round").default(1).notNull(),
    currentTierRound: integer("current_tier_round").default(1).notNull(),
    currentTeamIndex: integer("current_team_index").default(0).notNull(),
    direction: draftDirection("direction").default("forward").notNull(),
    turnNumber: integer("turn_number").default(1).notNull(),
    version: integer("version").default(1).notNull(),
    turnStartedAt: timestamp("turn_started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    turnEndsAt: timestamp("turn_ends_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    pausedRemainingSeconds: integer("paused_remaining_seconds"),
    startedAt: timestamp("started_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    completedAt: timestamp("completed_at", { withTimezone: true }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id, { onDelete: "restrict" }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("draft_sessions_live_unique")
      .on(table.status)
      .where(sql`${table.status} in ('active', 'paused', 'needs_repair')`),
    check("draft_sessions_round_check", sql`${table.currentRound} > 0`),
    check(
      "draft_sessions_tier_round_check",
      sql`${table.currentTierRound} > 0`,
    ),
    check(
      "draft_sessions_team_index_check",
      sql`${table.currentTeamIndex} >= 0`,
    ),
    check("draft_sessions_turn_check", sql`${table.turnNumber} > 0`),
    check("draft_sessions_version_check", sql`${table.version} > 0`),
  ],
);

/** Teams are snapshotted in their randomized turn order at draft start. */
export const draftSessionTeams = pgTable(
  "draft_session_teams",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => draftSessions.id, { onDelete: "cascade" }),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    orderIndex: integer("order_index").notNull(),
    captainRegistrationId: uuid("captain_registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    initialMemberCount: integer("initial_member_count").default(1).notNull(),
    incomplete: boolean("incomplete").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("draft_session_teams_session_team_unique").on(
      table.sessionId,
      table.teamId,
    ),
    uniqueIndex("draft_session_teams_session_order_unique").on(
      table.sessionId,
      table.orderIndex,
    ),
    uniqueIndex("draft_session_teams_session_captain_unique").on(
      table.sessionId,
      table.captainRegistrationId,
    ),
    check("draft_session_teams_order_check", sql`${table.orderIndex} >= 0`),
    check(
      "draft_session_teams_member_count_check",
      sql`${table.initialMemberCount} = 1`,
    ),
  ],
);

/** Approved, unteamed players frozen into the pool when the draft starts. */
export const draftPoolPlayers = pgTable(
  "draft_pool_players",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => draftSessions.id, { onDelete: "cascade" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    tier: tier("tier").notNull(),
    available: boolean("available").default(true).notNull(),
    pickedAt: timestamp("picked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    uniqueIndex("draft_pool_players_session_registration_unique").on(
      table.sessionId,
      table.registrationId,
    ),
    index("draft_pool_players_available_tier_idx").on(
      table.sessionId,
      table.available,
      table.tier,
    ),
  ],
);

export const draftPicks = pgTable(
  "draft_picks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    sessionId: uuid("session_id")
      .notNull()
      .references(() => draftSessions.id, { onDelete: "cascade" }),
    turnNumber: integer("turn_number").notNull(),
    round: integer("round").notNull(),
    tier: tier("tier").notNull(),
    direction: draftDirection("direction").notNull(),
    previousTier: tier("previous_tier").notNull(),
    previousRound: integer("previous_round").notNull(),
    previousTierRound: integer("previous_tier_round").notNull(),
    previousTeamIndex: integer("previous_team_index").notNull(),
    previousDirection: draftDirection("previous_direction").notNull(),
    teamId: uuid("team_id")
      .notNull()
      .references(() => teams.id, { onDelete: "restrict" }),
    captainRegistrationId: uuid("captain_registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    registrationId: uuid("registration_id")
      .notNull()
      .references(() => playerRegistrations.id, { onDelete: "restrict" }),
    source: draftPickSource("source").notNull(),
    requestKey: text("request_key"),
    createdBy: uuid("created_by").references(() => users.id, {
      onDelete: "restrict",
    }),
    committedAt: timestamp("committed_at", { withTimezone: true })
      .defaultNow()
      .notNull(),
    undoneAt: timestamp("undone_at", { withTimezone: true }),
  },
  (table) => [
    uniqueIndex("draft_picks_session_turn_live_unique")
      .on(table.sessionId, table.turnNumber)
      .where(sql`${table.undoneAt} is null`),
    uniqueIndex("draft_picks_session_player_live_unique")
      .on(table.sessionId, table.registrationId)
      .where(sql`${table.undoneAt} is null`),
    uniqueIndex("draft_picks_session_request_key_unique")
      .on(table.sessionId, table.requestKey)
      .where(sql`${table.requestKey} is not null`),
    index("draft_picks_session_committed_idx").on(
      table.sessionId,
      table.committedAt,
    ),
    check("draft_picks_turn_check", sql`${table.turnNumber} > 0`),
    check("draft_picks_round_check", sql`${table.round} > 0`),
  ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type PlayerRegistration = typeof playerRegistrations.$inferSelect;
export type NewPlayerRegistration = typeof playerRegistrations.$inferInsert;
