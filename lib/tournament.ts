import { createHash, timingSafeEqual } from "node:crypto";

export function hashInviteCode(code: string) {
  return createHash("sha256").update(code, "utf8").digest("hex");
}

export function inviteCodesMatch(inputHash: string, storedHash: string) {
  const input = Buffer.from(inputHash, "hex");
  const stored = Buffer.from(storedHash, "hex");

  if (input.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(input, stored);
}

export function formatDeadline(deadline: Date) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    timeZone: "UTC",
    timeZoneName: "short",
    year: "numeric",
  }).format(deadline);
}
