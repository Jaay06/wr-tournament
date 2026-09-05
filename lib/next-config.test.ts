import assert from "node:assert/strict";
import { test } from "node:test";

import nextConfig from "../next.config";

test("production builds use a stable deployment identifier", () => {
  assert.match(nextConfig.deploymentId ?? "", /^[A-Za-z0-9_-]+$/);
});
