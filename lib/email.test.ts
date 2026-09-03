import assert from "node:assert/strict";
import test from "node:test";

import { getPasswordResetDeliveryKind } from "./email";

const smtpEnvironmentKeys = [
  "SMTP_HOST",
  "SMTP_PORT",
  "SMTP_USER",
  "SMTP_PASSWORD",
  "EMAIL_FROM",
] as const;

test("password reset delivery falls back to console only in development", () => {
  const environment = process.env as Record<string, string | undefined>;
  const previousNodeEnv = environment.NODE_ENV;
  const previousSmtpEnvironment = Object.fromEntries(
    smtpEnvironmentKeys.map((key) => [key, process.env[key]]),
  );

  try {
    for (const key of smtpEnvironmentKeys) {
      delete environment[key];
    }

    environment.NODE_ENV = "development";
    assert.equal(getPasswordResetDeliveryKind(), "console");

    environment.NODE_ENV = "production";
    assert.equal(getPasswordResetDeliveryKind(), "unavailable");
  } finally {
    if (previousNodeEnv === undefined) {
      delete environment.NODE_ENV;
    } else {
      environment.NODE_ENV = previousNodeEnv;
    }

    for (const key of smtpEnvironmentKeys) {
      const previousValue = previousSmtpEnvironment[key];

      if (previousValue === undefined) {
        delete environment[key];
      } else {
        environment[key] = previousValue;
      }
    }
  }
});
