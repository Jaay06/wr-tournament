import assert from "node:assert/strict";
import test from "node:test";

import { clearRateLimitBuckets, consumeRateLimit } from "./rate-limit";

test("rate limits allow the configured number of attempts, then block", () => {
  clearRateLimitBuckets();

  assert.equal(consumeRateLimit("test", { limit: 2, windowMs: 1_000 }, 100), true);
  assert.equal(consumeRateLimit("test", { limit: 2, windowMs: 1_000 }, 200), true);
  assert.equal(consumeRateLimit("test", { limit: 2, windowMs: 1_000 }, 300), false);
  assert.equal(consumeRateLimit("other", { limit: 2, windowMs: 1_000 }, 300), true);
});

test("rate limit buckets reset after their window", () => {
  clearRateLimitBuckets();

  assert.equal(consumeRateLimit("test", { limit: 1, windowMs: 1_000 }, 100), true);
  assert.equal(consumeRateLimit("test", { limit: 1, windowMs: 1_000 }, 500), false);
  assert.equal(consumeRateLimit("test", { limit: 1, windowMs: 1_000 }, 1_100), true);
});

