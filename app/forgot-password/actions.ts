"use server";

import { and, eq, isNotNull, isNull } from "drizzle-orm";
import { headers } from "next/headers";

import { db } from "@/db";
import { passwordResetTokens, users } from "@/db/schema";
import { sendPasswordResetEmail, getPasswordResetDeliveryKind } from "@/lib/email";
import {
  createPasswordResetToken,
  getPasswordResetTokenTtlMinutes,
} from "@/lib/password-reset";
import { consumeRateLimit } from "@/lib/rate-limit";
import { emailSchema } from "@/lib/validation";

const PASSWORD_RESET_REQUEST_MESSAGE =
  "If an account matches that email, reset instructions will be sent shortly.";
const PASSWORD_RESET_RATE_LIMIT_MESSAGE =
  "Too many requests. Try again in a few minutes.";

const IP_RATE_LIMIT = {
  limit: 20,
  windowMs: 60 * 60 * 1000,
} as const;

const EMAIL_RATE_LIMIT = {
  limit: 3,
  windowMs: 15 * 60 * 1000,
} as const;

export type PasswordResetRequestState = {
  error?: string;
  success?: string;
};

function requestClientKey(value: string | null) {
  return value?.split(",")[0]?.trim().slice(0, 128) || "unknown-client";
}

async function getClientKey() {
  const requestHeaders = await headers();
  const forwardedFor = requestHeaders.get("x-forwarded-for");
  const realIp = requestHeaders.get("x-real-ip");

  return requestClientKey(forwardedFor || realIp);
}

function resetUrlForToken(token: string) {
  const configuredUrl = process.env.APP_URL?.trim();

  if (!configuredUrl && process.env.NODE_ENV !== "development") {
    throw new Error("APP_URL is required for password-reset links.");
  }

  const appUrl = new URL(configuredUrl || "http://localhost:3000");

  if (
    !["http:", "https:"].includes(appUrl.protocol) ||
    (process.env.NODE_ENV === "production" && appUrl.protocol !== "https:")
  ) {
    throw new Error("APP_URL must use a valid secure application origin.");
  }

  const resetUrl = new URL("/reset-password", appUrl);
  resetUrl.searchParams.set("token", token);
  return resetUrl.toString();
}

export async function requestPasswordReset(
  _previousState: PasswordResetRequestState,
  formData: FormData,
): Promise<PasswordResetRequestState> {
  const clientKey = await getClientKey();

  if (!consumeRateLimit(`password-reset:ip:${clientKey}`, IP_RATE_LIMIT)) {
    return { error: PASSWORD_RESET_RATE_LIMIT_MESSAGE };
  }

  const parsed = emailSchema.safeParse(formData.get("email"));
  if (!parsed.success) {
    return { error: "Enter a valid email address." };
  }

  if (!consumeRateLimit(`password-reset:email:${parsed.data}`, EMAIL_RATE_LIMIT)) {
    return { error: PASSWORD_RESET_RATE_LIMIT_MESSAGE };
  }

  if (getPasswordResetDeliveryKind() === "unavailable") {
    console.error(
      "[password-reset] Email delivery is unavailable. Configure SMTP before production use.",
    );
    return { success: PASSWORD_RESET_REQUEST_MESSAGE };
  }

  const [user] = await db
    .select({
      displayName: users.displayName,
      email: users.email,
      id: users.id,
    })
    .from(users)
    .where(and(eq(users.email, parsed.data), isNotNull(users.passwordHash)))
    .limit(1);

  if (!user?.email) {
    return { success: PASSWORD_RESET_REQUEST_MESSAGE };
  }

  const resetToken = createPasswordResetToken();
  const expiresInMinutes = getPasswordResetTokenTtlMinutes();

  await db.transaction(async (tx) => {
    await tx
      .delete(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.userId, user.id),
          isNull(passwordResetTokens.usedAt),
        ),
      );

    await tx.insert(passwordResetTokens).values({
      expiresAt: resetToken.expiresAt,
      tokenHash: resetToken.tokenHash,
      userId: user.id,
    });
  });

  try {
    await sendPasswordResetEmail({
      displayName: user.displayName,
      expiresInMinutes,
      resetUrl: resetUrlForToken(resetToken.token),
      to: user.email,
    });
  } catch (error) {
    await db
      .delete(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, resetToken.tokenHash));

    if (process.env.NODE_ENV === "development") {
      console.error(
        "[password-reset] SMTP delivery failed. The reset link was not sent.",
        error,
      );
    } else {
      console.error("[password-reset] SMTP delivery failed.");
    }
  }

  return { success: PASSWORD_RESET_REQUEST_MESSAGE };
}
