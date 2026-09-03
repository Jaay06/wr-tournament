import assert from "node:assert/strict";
import test from "node:test";

import { tournamentEntryFor } from "./tournament-entry";

test("signed-out visitors enter through sign-in", () => {
  assert.deepEqual(tournamentEntryFor(null), {
    href: "/signin?callbackUrl=%2Finvite",
    label: "Enter tournament",
    description: "Sign in first, then use the link or code your organizer shared.",
    status: "Private tournament data stays behind sign-in.",
    title: "Have the invite?",
  });
});

test("signed-in outsiders continue to the invite", () => {
  assert.deepEqual(
    tournamentEntryFor({
      user: { id: "user-1", hasJoinedTournament: false },
    }),
    {
      href: "/invite",
      label: "Enter invite",
      description: "You are signed in. Use the link or code your organizer shared.",
      status: "Your account is signed in.",
      title: "Have the invite?",
    },
  );
});

test("tournament participants return to their dashboard", () => {
  assert.deepEqual(
    tournamentEntryFor({
      user: { id: "user-1", hasJoinedTournament: true },
    }),
    {
      href: "/tournament",
      label: "Go to tournament",
      description: "You are signed in and ready to return to the tournament.",
      status: "Your tournament access is active.",
      title: "Back to the tournament?",
    },
  );
});
