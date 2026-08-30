import { parseArgs } from "node:util";

import { config } from "dotenv";

import { generateInviteCode, hashInviteCode } from "../lib/tournament";
import { normalizeEmail } from "../lib/validation";

config({ path: ".env.local" });
config({ path: ".env" });

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    name: { type: "string" },
    region: { type: "string" },
    "replace-invite": { type: "boolean" },
  },
});

async function main() {
  const organizerEmail = process.env.ORGANIZER_EMAIL
    ? normalizeEmail(process.env.ORGANIZER_EMAIL)
    : "";

  if (!organizerEmail) {
    throw new Error("Set ORGANIZER_EMAIL in .env.local before running db:setup.");
  }

  const { db, pool } = await import("../db");
  const {
    tournamentParticipants,
    tournamentSettings,
    users,
  } = await import("../db/schema");
  const { eq } = await import("drizzle-orm");

  const tournamentName = values.name?.trim() || "Rift Clash";
  const region = values.region?.trim() || "EU";
  const inviteCode = generateInviteCode();
  const replaceInvite = values["replace-invite"] === true;

  try {
    await db.transaction(async (tx) => {
      const [existingSettings] = await tx
        .select({
          id: tournamentSettings.id,
          registrationDeadline: tournamentSettings.registrationDeadline,
        })
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
        registrationDeadline: existingSettings?.registrationDeadline ?? null,
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
      "The organizer was added as a participant. Registration is open until an organizer sets a deadline.",
    );
    console.log(`Invite code: ${inviteCode}`);
    console.log("Share this code with friends. It will not be shown again.");
  } finally {
    await pool.end();
  }
}

void main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
