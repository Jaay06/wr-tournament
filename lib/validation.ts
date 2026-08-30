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
  code: z.string().trim().min(1).max(128),
});

export const organizerSettingsSchema = z.object({
  name: z.string().trim().min(1).max(80),
  region: z.string().trim().min(2).max(40),
  registrationDeadline: z.string().trim().max(64).optional(),
  inviteEnabled: z.boolean(),
});

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
