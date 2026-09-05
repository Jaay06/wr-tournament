export type TournamentEntry = {
  href: string;
  label: string;
  description: string;
  status: string;
  title: string;
};

type EntrySession = {
  user?: {
    hasJoinedTournament?: boolean;
    id?: string;
  };
} | null;

const signedOutEntry: TournamentEntry = {
  href: "/signin?callbackUrl=%2Finvite",
  label: "Enter tournament",
  description: "Sign in first, then use the link or code your organizer shared.",
  status: "Private tournament data stays behind sign-in.",
  title: "Have the invite?",
};

export const publicEntry: TournamentEntry = {
  href: "/tournament",
  label: "Enter tournament",
  description: "Open the private tournament room, then sign in or use your invite.",
  status: "Private tournament data stays behind sign-in.",
  title: "Have the invite?",
};

const inviteEntry: TournamentEntry = {
  href: "/invite",
  label: "Enter invite",
  description: "You are signed in. Use the link or code your organizer shared.",
  status: "Your account is signed in.",
  title: "Have the invite?",
};

const participantEntry: TournamentEntry = {
  href: "/tournament",
  label: "Go to tournament",
  description: "You are signed in and ready to return to the tournament.",
  status: "Your tournament access is active.",
  title: "Back to the tournament?",
};

export function tournamentEntryFor(session: EntrySession): TournamentEntry {
  if (!session?.user?.id) {
    return signedOutEntry;
  }

  return session.user.hasJoinedTournament ? participantEntry : inviteEntry;
}
