import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(1).max(128),
});

export const registerSchema = z.object({
  displayName: z.string().trim().min(2).max(60),
  email: z.string().trim().toLowerCase().email().max(320),
  password: z.string().min(8).max(128),
});

export const inviteCodeSchema = z.object({
  code: z.string().trim().regex(/^\d{4}$/),
});

export const organizerSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  region: z.string().trim().min(2).max(40),
  registrationDeadline: z.string().trim().max(64).optional(),
  inviteEnabled: z.boolean(),
});

export const playerRegistrationSchema = z
  .object({
    riotName: z.string().trim().min(1).max(32),
    riotTag: z.string().trim().min(1).max(16),
    currentRank: z.string().trim().min(1).max(40),
    selfAssessedTier: z.enum(["T1", "T2", "T3", "T4"]),
    primaryRole: z.enum(["Baron", "Jungle", "Mid", "Dragon", "Support"]),
    secondaryRole: z.enum(["Baron", "Jungle", "Mid", "Dragon", "Support"]),
  })
  .refine((value) => value.primaryRole !== value.secondaryRole, {
    message: "Choose two different roles.",
    path: ["secondaryRole"],
  });

export const teamNameSchema = z.string().trim().min(2).max(60);

export const teamIdSchema = z.string().uuid();

export const tierSchema = z.enum(["T1", "T2", "T3", "T4"]);

export const lineupSchema = z.array(
  z.object({
    registrationId: z.string().uuid(),
    lineupPosition: z.enum(["starter", "substitute"]),
    starterRole: z
      .enum(["Baron", "Jungle", "Mid", "Dragon", "Support"])
      .nullable(),
  }),
);

export const announcementSchema = z.object({
  title: z.string().trim().min(2).max(120),
  body: z.string().trim().min(2).max(2000),
});

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
