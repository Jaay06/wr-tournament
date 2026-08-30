"use server";

import { revalidatePath } from "next/cache";
import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import {
  announcements,
  notifications,
  tournamentParticipants,
  tournamentSettings,
} from "@/db/schema";
import {
  generateInviteCode,
  hashInviteCode,
} from "@/lib/tournament";
import { announcementSchema, organizerSettingsSchema } from "@/lib/validation";

export type SettingsState = {
  error?: string;
  success?: string;
};

export type InviteCodeState = {
  code?: string;
  error?: string;
};

export type AnnouncementState = {
  error?: string;
  success?: string;
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

export async function createAnnouncement(
  _previousState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in before posting an announcement." };
  }
  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can post announcements." };
  }

  const parsed = announcementSchema.safeParse({
    title: formString(formData, "title"),
    body: formString(formData, "body"),
  });
  if (!parsed.success) {
    return { error: "Add a title and message before posting." };
  }

  await db.transaction(async (tx) => {
    await tx.insert(announcements).values({
      title: parsed.data.title,
      body: parsed.data.body,
      createdBy: session.user.id,
    });

    const participants = await tx
      .select({ userId: tournamentParticipants.userId })
      .from(tournamentParticipants);
    if (participants.length > 0) {
      await tx.insert(notifications).values(
        participants.map(({ userId }) => ({
          userId,
          type: "announcement",
          message: parsed.data.title,
        })),
      );
    }
  });

  revalidateTournamentPages();
  return { success: "Announcement posted." };
}

export async function deleteAnnouncement(
  _previousState: AnnouncementState,
  formData: FormData,
): Promise<AnnouncementState> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Sign in before deleting an announcement." };
  }
  if (session.user.role !== "organizer") {
    return { error: "Only the organizer can delete announcements." };
  }

  const id = formString(formData, "id");
  if (!id) {
    return { error: "That announcement could not be found." };
  }

  await db.delete(announcements).where(eq(announcements.id, id));
  revalidateTournamentPages();
  return { success: "Announcement deleted." };
}
