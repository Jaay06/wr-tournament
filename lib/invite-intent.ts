import "server-only";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import { inviteCodeFromCallbackUrl } from "@/lib/redirect";
import { hashInviteCode, inviteCodesMatch } from "@/lib/tournament";
import { inviteCodeSchema } from "@/lib/validation";

export type InviteIntentStatus = "none" | "recognized" | "invalid" | "closed";

export async function getInviteIntentStatus(
  callbackUrl: string,
): Promise<InviteIntentStatus> {
  const code = inviteCodeFromCallbackUrl(callbackUrl);
  if (code === null) {
    return "none";
  }

  const parsed = inviteCodeSchema.safeParse({ code });
  if (!parsed.success) {
    return "invalid";
  }

  const [settings] = await db
    .select({
      inviteCodeHash: tournamentSettings.inviteCodeHash,
      inviteEnabled: tournamentSettings.inviteEnabled,
    })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return "invalid";
  }

  if (!settings.inviteEnabled) {
    return "closed";
  }

  return inviteCodesMatch(
    hashInviteCode(parsed.data.code.toUpperCase()),
    settings.inviteCodeHash,
  )
    ? "recognized"
    : "invalid";
}
