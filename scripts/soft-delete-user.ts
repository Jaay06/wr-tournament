import { parseArgs } from "node:util";

import { config } from "dotenv";

import { emailSchema } from "../lib/validation";

config({ path: ".env.local" });
config({ path: ".env" });

const { values } = parseArgs({
  allowPositionals: false,
  options: {
    email: { type: "string", short: "e" },
  },
});

async function main() {
  const parsedEmail = emailSchema.safeParse(values.email);

  if (!parsedEmail.success) {
    throw new Error("Pass one valid account email with --email <address>.");
  }

  const { softDeleteUserByEmail } = await import("../lib/user-account");
  const result = await softDeleteUserByEmail(parsedEmail.data);

  if (result.status === "not_found") {
    console.log(`No active account found for ${result.email}.`);
    return;
  }

  if (result.status === "already_deleted") {
    console.log(
      `Account ${result.email} was already soft-deleted at ${result.deletedAt.toISOString()}.`,
    );
    return;
  }

  console.log(
    `Soft-deleted ${result.email} at ${result.deletedAt.toISOString()}.`,
  );
  console.log(
    `Revoked ${result.revokedInviteCount} pending invite(s) and ${result.revokedJoinRequestCount} pending join request(s).`,
  );
}

void main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(async () => {
    const { pool } = await import("../db");
    await pool.end();
  });
