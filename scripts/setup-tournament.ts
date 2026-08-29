import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";
import { parseArgs } from "node:util";

import { config } from "dotenv";

import { hashInviteCode } from "../lib/tournament";
import { normalizeEmail } from "../lib/validation";

config({ path: ".env.local" });
config({ path: ".env" });

const { db, pool } = await import("../db");
const {
  tournamentParticipants,
  tournamentSettings,
  users,
} = await import("../db/schema");
const { eq } = await import("drizzle-orm");

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    deadline: { type: "string" },
    "invite-code": { type: "string" },
    name: { type: "string" },
    region: { type: "string" },
    "replace-invite": { type: "boolean" },
  },
});

const organizerEmail = process.env.ORGANIZER_EMAIL
  ? normalizeEmail(process.env.ORGANIZER_EMAIL)
  : "";

if (!organizerEmail) {
  throw new Error("Set ORGANIZER_EMAIL in .env.local before running db:setup.");
}

const readline = createInterface({ input, output });

async function valueOrPrompt(value: string | undefined, prompt: string) {
  if (value?.trim()) {
    return value.trim();
  }

  return (await readline.question(prompt)).trim();
}

const tournamentName = await valueOrPrompt(
  values.name,
  "Tournament name: ",
);
const region = await valueOrPrompt(values.region, "Wild Rift region: ");
const deadlineInput = await valueOrPrompt(
  values.deadline,
  "Registration deadline (ISO 8601, for example 2026-09-30T18:00:00Z): ",
);
const inviteCode = await valueOrPrompt(
  values["invite-code"],
  "Private invite code (8+ characters): ",
);

readline.close();

if (!tournamentName || !region || !deadlineInput || inviteCode.length < 8) {
  await pool.end();
  throw new Error(
    "Name, region, deadline, and an invite code of 8+ characters are required.",
  );
}

const registrationDeadline = new Date(deadlineInput);

if (
  Number.isNaN(registrationDeadline.getTime()) ||
  registrationDeadline.getTime() <= Date.now()
) {
  await pool.end();
  throw new Error("Registration deadline must be a valid future date.");
}

const replaceInvite = values["replace-invite"] === true;

try {
  await db.transaction(async (tx) => {
    const [existingSettings] = await tx
      .select({ id: tournamentSettings.id })
      .from(tournamentSettings)
      .where(eq(tournamentSettings.id, 1))
      .limit(1);

    if (existingSettings && !replaceInvite) {
      throw new Error(
        "The tournament is already configured. Pass --replace-invite to update its invite and settings.",
      );
    }

    const [existingOrganizer] = await tx
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, organizerEmail))
      .limit(1);

    if (!existingOrganizer) {
      throw new Error(
        `No account found for ${organizerEmail}. Register that email first, then run db:setup.`,
      );
    }

    const organizerId = existingOrganizer.id;

    await tx
      .update(users)
      .set({ role: "organizer" })
      .where(eq(users.id, organizerId));

    await tx
      .insert(tournamentParticipants)
      .values({ userId: organizerId })
      .onConflictDoNothing();

    const settings = {
      name: tournamentName,
      region,
      inviteCodeHash: hashInviteCode(inviteCode),
      inviteEnabled: true,
      registrationDeadline,
      updatedBy: organizerId,
      updatedAt: new Date(),
    };

    if (existingSettings) {
      await tx
        .update(tournamentSettings)
        .set(settings)
        .where(eq(tournamentSettings.id, 1));
    } else {
      await tx.insert(tournamentSettings).values({ id: 1, ...settings });
    }
  });

  console.log(`Tournament "${tournamentName}" is ready for ${organizerEmail}.`);
  console.log(
    "The organizer was added as a participant. The invite code was stored only as a hash.",
  );
} finally {
  await pool.end();
}
