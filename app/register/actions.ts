"use server";

import { eq } from "drizzle-orm";

import { db } from "@/db";
import { users } from "@/db/schema";
import { hashPassword } from "@/lib/password";
import { registerSchema } from "@/lib/validation";

export type RegisterState = {
  error?: string;
  success?: boolean;
};

function isUniqueViolation(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    error.code === "23505"
  );
}

export async function registerWithCredentials(
  _previousState: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    displayName: formData.get("displayName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: "Use a name, a valid email, and a password of at least 8 characters." };
  }

  const [existingUser] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, parsed.data.email))
    .limit(1);

  if (existingUser) {
    return { error: "That email already has an account. Try signing in." };
  }

  const passwordHash = await hashPassword(parsed.data.password);

  try {
    await db.insert(users).values({
      displayName: parsed.data.displayName,
      email: parsed.data.email,
      passwordHash,
    });
  } catch (error) {
    if (isUniqueViolation(error)) {
      return { error: "That email already has an account. Try signing in." };
    }

    throw error;
  }

  return { success: true };
}
