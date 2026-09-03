import { createHash, randomBytes } from "node:crypto";

const PASSWORD_RESET_TOKEN_BYTES = 32;
const DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES = 30;

export function hashPasswordResetToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createPasswordResetToken(now = new Date()) {
  const token = randomBytes(PASSWORD_RESET_TOKEN_BYTES).toString("hex");
  const tokenHash = hashPasswordResetToken(token);

  return {
    token,
    tokenHash,
    expiresAt: new Date(now.getTime() + getPasswordResetTokenTtlMinutes() * 60_000),
  };
}

export function getPasswordResetTokenTtlMinutes() {
  const configuredTtl = Number(process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES);

  if (Number.isFinite(configuredTtl) && configuredTtl > 0) {
    return Math.floor(configuredTtl);
  }

  return DEFAULT_PASSWORD_RESET_TOKEN_TTL_MINUTES;
}

