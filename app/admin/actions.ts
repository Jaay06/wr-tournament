"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentSettings } from "@/db/schema";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/tournament";
import { organizerSettingsSchema } from "@/lib/validation";

export type SettingsState = {
  error?: string;
  success?: string;
};

export type InviteCodeState = {
  code?: string;
  error?: string;
};

function formString(formData: FormData, name: string) {
  const value = formData.get(name);

  return typeof value === "string" ? value : undefined;
}

function revalidateTournamentPages() {
  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/invite");
  revalidatePath("/tournament");
}

export async function updateTournamentSettings(
  _previousState: SettingsState,
  formData: FormData,
): Promise<SettingsState> {
  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before changing tournament settings." };
  }

  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can change tournament settings." };
  }

  const parsed = organizerSettingsSchema.safeParse({
    name: formString(formData, "name"),
    region: formString(formData, "region"),
    registrationDeadline:
      formString(formData, "registrationDeadline")?.trim() || undefined,
    inviteEnabled: formString(formData, "inviteEnabled") === "on",
  });

  if (!parsed.success) {
    return { error: "Enter a tournament name and region before saving." };
  }

  let registrationDeadline: Date | null = null;

  if (parsed.data.registrationDeadline) {
    registrationDeadline = new Date(parsed.data.registrationDeadline);

    if (Number.isNaN(registrationDeadline.getTime())) {
      return { error: "Enter a valid registration deadline." };
    }
  }

  const [settings] = await db
    .select({ id: tournamentSettings.id })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return { error: "Run the tournament setup command before editing settings." };
  }

  await db
    .update(tournamentSettings)
    .set({
      name: parsed.data.name,
      region: parsed.data.region,
      inviteEnabled: parsed.data.inviteEnabled,
      registrationDeadline,
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(tournamentSettings.id, 1));

  revalidateTournamentPages();

  return { success: "Tournament settings saved." };
}

export async function generateTournamentInvite(
  _previousState: InviteCodeState,
): Promise<InviteCodeState> {
  void _previousState;

  const session = await auth();

  if (!session?.user?.id) {
    return { error: "Sign in before generating an invite." };
  }

  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can generate an invite." };
  }

  const [settings] = await db
    .select({ id: tournamentSettings.id })
    .from(tournamentSettings)
    .where(eq(tournamentSettings.id, 1))
    .limit(1);

  if (!settings) {
    return { error: "Run the tournament setup command before generating an invite." };
  }

  const code = generateInviteCode();

  await db
    .update(tournamentSettings)
    .set({
      inviteCodeHash: hashInviteCode(code),
      updatedBy: session.user.id,
      updatedAt: new Date(),
    })
    .where(eq(tournamentSettings.id, 1));

  revalidateTournamentPages();

  return { code };
}
