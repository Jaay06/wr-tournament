import assert from "node:assert/strict";
import test from "node:test";

import { formatDeadlineState } from "./tournament";

const now = new Date("2026-08-30T12:00:00.000Z");

test("formatDeadlineState reports an open deadline", () => {
  assert.deepEqual(formatDeadlineState(null, now), {
    status: "open",
    label: "Registration is open",
    compactLabel: "OPEN",
  });
});

test("formatDeadlineState formats days and hours", () => {
  assert.equal(
    formatDeadlineState(new Date("2026-09-06T02:30:00.000Z"), now).compactLabel,
    "6D 14H LEFT",
  );
});

test("formatDeadlineState keeps a minute-only deadline readable", () => {
  assert.equal(
    formatDeadlineState(new Date("2026-08-30T12:42:00.000Z"), now).compactLabel,
    "42M LEFT",
  );
});

test("formatDeadlineState reports a passed deadline", () => {
  assert.deepEqual(
    formatDeadlineState(new Date("2026-08-30T11:59:59.000Z"), now),
    {
      status: "passed",
      label: "Registration is closed",
      compactLabel: "CLOSED",
    },
  );
});
