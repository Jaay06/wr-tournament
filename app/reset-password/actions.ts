"use server";

import { and, eq, gt, isNull } from "drizzle-orm";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { hashPasswordResetToken } from "@/lib/password-reset";
import { passwordResetSchema } from "@/lib/validation";
import { hashPassword } from "@/lib/password";

export type ResetPasswordState = {
  error?: string;
  success?: boolean;
};

const INVALID_RESET_LINK_MESSAGE = "That reset link is invalid or has expired.";

export async function resetPassword(
  _previousState: ResetPasswordState,
  formData: FormData,
): Promise<ResetPasswordState> {
  const parsed = passwordResetSchema.safeParse({
    confirmPassword: formData.get("confirmPassword"),
    password: formData.get("password"),
    token: formData.get("token"),
  });

  if (!parsed.success) {
    const passwordMismatch = parsed.error.issues.some(
      (issue) => issue.path[0] === "confirmPassword" && issue.code === "custom",
    );

    return {
      error: passwordMismatch
        ? "Passwords do not match."
        : "Use a valid reset link and a password of at least 8 characters.",
    };
  }

  const now = new Date();
  const tokenHash = hashPasswordResetToken(parsed.data.token);

  const resetCompleted = await db.transaction(async (tx) => {
    const [resetToken] = await tx
      .select({ userId: passwordResetTokens.userId })
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.tokenHash, tokenHash),
          isNull(passwordResetTokens.usedAt),
          gt(passwordResetTokens.expiresAt, now),
        ),
      )
      .for("update")
      .limit(1);

    if (!resetToken) {
      return false;
    }

    const passwordHash = await hashPassword(parsed.data.password);

    await tx
      .update(users)
      .set({ passwordHash, updatedAt: now })
      .where(eq(users.id, resetToken.userId));

    await tx
      .update(passwordResetTokens)
      .set({ usedAt: now })
      .where(
        and(
          eq(passwordResetTokens.userId, resetToken.userId),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    return true;
  });

  return resetCompleted
    ? { success: true }
    : { error: INVALID_RESET_LINK_MESSAGE };
}
