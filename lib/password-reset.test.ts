import assert from "node:assert/strict";
import test from "node:test";

import {
  createPasswordResetToken,
  getPasswordResetTokenTtlMinutes,
  hashPasswordResetToken,
} from "./password-reset";

test("password reset tokens are random hex values with a hashed lookup value", () => {
  const token = createPasswordResetToken(new Date("2026-09-03T12:00:00.000Z"));

  assert.match(token.token, /^[0-9a-f]{64}$/);
  assert.match(token.tokenHash, /^[0-9a-f]{64}$/);
  assert.equal(token.tokenHash, hashPasswordResetToken(token.token));
  assert.notEqual(token.tokenHash, token.token);
});

test("password reset token expiry uses the configured positive TTL", () => {
  const previousTtl = process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES;

  process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = "12";

  try {
    const now = new Date("2026-09-03T12:00:00.000Z");
    const token = createPasswordResetToken(now);

    assert.equal(getPasswordResetTokenTtlMinutes(), 12);
    assert.equal(token.expiresAt.toISOString(), "2026-09-03T12:12:00.000Z");
  } finally {
    if (previousTtl === undefined) {
      delete process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES;
    } else {
      process.env.PASSWORD_RESET_TOKEN_TTL_MINUTES = previousTtl;
    }
  }
});

