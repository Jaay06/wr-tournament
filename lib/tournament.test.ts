import assert from "node:assert/strict";
import test from "node:test";

import { generateInviteCode, formatDeadlineState } from "./tournament";
import {
  availableTournamentParticipants,
  participantTeamExitMode,
  reconcileLineupAssignments,
  roleMatchesPreferences,
  shouldReopenSubmittedTeam,
  validateRoster,
} from "./tournament-rules";
import {
  callbackPathFromAuthCookie,
  inviteCodeFromCallbackUrl,
  postAuthRedirectPath,
} from "./redirect";
import { inviteCodeSchema } from "./validation";

const now = new Date("2026-08-30T12:00:00.000Z");

test("formatDeadlineState reports an open deadline", () => {
  assert.deepEqual(formatDeadlineState(null, now), {
    status: "open",
    label: "Registration is open",
    compactLabel: "OPEN",
  });
});

test("formatDeadlineState formats days and hours", () => {
  assert.equal(
    formatDeadlineState(new Date("2026-09-06T02:30:00.000Z"), now).compactLabel,
    "6D 14H LEFT",
  );
});

test("formatDeadlineState keeps a minute-only deadline readable", () => {
  assert.equal(
    formatDeadlineState(new Date("2026-08-30T12:42:00.000Z"), now).compactLabel,
    "42M LEFT",
  );
});

test("formatDeadlineState reports a passed deadline", () => {
  assert.deepEqual(
    formatDeadlineState(new Date("2026-08-30T11:59:59.000Z"), now),
    {
      status: "passed",
      label: "Registration is closed",
      compactLabel: "CLOSED",
    },
  );
});

test("generated invite codes keep the private invite boundary", () => {
  const code = generateInviteCode();

  assert.match(code, /^[0-9]{4}$/);
  assert.equal(code.length, 4);
  assert.equal(inviteCodeSchema.safeParse({ code }).success, true);
  assert.equal(inviteCodeSchema.safeParse({ code: "12345" }).success, false);
  assert.equal(inviteCodeSchema.safeParse({ code: "AB12" }).success, false);
});

test("a valid submitted team stays submitted after an organizer repair", () => {
  assert.equal(shouldReopenSubmittedTeam("submitted", { valid: true }), false);
});

test("an invalid submitted team returns to draft after an organizer repair", () => {
  assert.equal(shouldReopenSubmittedTeam("submitted", { valid: false }), true);
});

test("a draft team never reopens", () => {
  assert.equal(shouldReopenSubmittedTeam("draft", { valid: false }), false);
});

test("role warnings are derived from the assigned and preferred roles", () => {
  assert.equal(roleMatchesPreferences("Dragon", "Baron", "Support"), false);
  assert.equal(roleMatchesPreferences("Support", "Baron", "Support"), true);

  const validation = validateRoster([
    { displayName: "A", approvedTier: "T3", lineupPosition: "starter", starterRole: "Baron", primaryRole: "Baron", secondaryRole: "Mid" },
    { displayName: "B", approvedTier: "T3", lineupPosition: "starter", starterRole: "Jungle", primaryRole: "Jungle", secondaryRole: "Baron" },
    { displayName: "C", approvedTier: "T3", lineupPosition: "starter", starterRole: "Mid", primaryRole: "Mid", secondaryRole: "Support" },
    { displayName: "D", approvedTier: "T3", lineupPosition: "starter", starterRole: "Dragon", primaryRole: "Baron", secondaryRole: "Support" },
    { displayName: "E", approvedTier: "T4", lineupPosition: "starter", starterRole: "Support", primaryRole: "Support", secondaryRole: "Dragon" },
  ]);

  assert.deepEqual(validation.warnings, [
    "D prefers Baron or Support, not Dragon.",
  ]);
});

test("invite choices exclude assigned players and already-pending recipients", () => {
  const participants = [
    { id: "free", displayName: "Free", riotName: "Free", riotTag: "1", approvedTier: "T4" as const, teamId: null },
    { id: "assigned", displayName: "Assigned", riotName: "Assigned", riotTag: "2", approvedTier: "T3" as const, teamId: "other-team" },
    { id: "pending", displayName: "Pending", riotName: "Pending", riotTag: "3", approvedTier: null, teamId: null },
  ];

  assert.deepEqual(
    availableTournamentParticipants(participants, [], ["pending"]).map(
      (participant) => participant.id,
    ),
    ["free"],
  );
});

test("lineup drafts add new members without discarding existing edits", () => {
  const assignments = reconcileLineupAssignments(
    [
      {
        registrationId: "captain",
        lineupPosition: "substitute" as const,
        starterRole: null,
      },
      {
        registrationId: "departed",
        lineupPosition: "starter" as const,
        starterRole: "Mid" as const,
      },
    ],
    [
      {
        registrationId: "captain",
        lineupPosition: "starter" as const,
        starterRole: "Baron" as const,
      },
      {
        registrationId: "new-member",
        lineupPosition: "substitute" as const,
        starterRole: null,
      },
    ],
  );

  assert.deepEqual(assignments, [
    {
      registrationId: "captain",
      lineupPosition: "substitute",
      starterRole: null,
    },
    {
      registrationId: "new-member",
      lineupPosition: "substitute",
      starterRole: null,
    },
  ]);
});

test("team exit controls follow captain ownership rules", () => {
  assert.equal(
    participantTeamExitMode({ isCaptain: false, memberCount: 4 }),
    "leave",
  );
  assert.equal(
    participantTeamExitMode({ isCaptain: true, memberCount: 1 }),
    "delete",
  );
  assert.equal(
    participantTeamExitMode({ isCaptain: true, memberCount: 4 }),
    "transfer",
  );
});

test("Discord account-link recovery preserves the invite callback path", () => {
  const callback = "/invite?code=ABCDEF0123456789ABCDEF0123456789";

  assert.equal(
    callbackPathFromAuthCookie(`https://rift.example${callback}`),
    callback,
  );
  assert.equal(
    callbackPathFromAuthCookie(encodeURIComponent(`https://rift.example${callback}`)),
    callback,
  );
});

test("invite intent parsing only accepts the invite route", () => {
  assert.equal(
    inviteCodeFromCallbackUrl(
      "/invite?code=ABCDEF0123456789ABCDEF0123456789",
    ),
    "ABCDEF0123456789ABCDEF0123456789",
  );
  assert.equal(inviteCodeFromCallbackUrl("/tournament?code=secret"), null);
});

test("signed-in auth pages return to a safe application route", () => {
  assert.equal(postAuthRedirectPath("/tournament/team"), "/tournament/team");
  assert.equal(postAuthRedirectPath("/signin?callbackUrl=/signin"), "/invite");
  assert.equal(postAuthRedirectPath("/register"), "/invite");
  assert.equal(postAuthRedirectPath("https://example.com"), "/invite");
});
