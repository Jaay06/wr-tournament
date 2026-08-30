import { createHash, randomInt, timingSafeEqual } from 'node:crypto';

export function generateInviteCode() {
  return randomInt(0, 10_000).toString().padStart(4, '0');
}

export function hashInviteCode(code: string) {
  return createHash('sha256').update(code, 'utf8').digest('hex');
}

export function inviteCodesMatch(inputHash: string, storedHash: string) {
  const input = Buffer.from(inputHash, 'hex');
  const stored = Buffer.from(storedHash, 'hex');

  if (input.length !== stored.length) {
    return false;
  }

  return timingSafeEqual(input, stored);
}

export function formatDeadline(deadline: Date | null | undefined) {
  if (!deadline) {
    return 'Open';
  }

  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    month: 'short',
    timeZone: 'UTC',
    timeZoneName: 'short',
    year: 'numeric',
  }).format(deadline);
}

export type DeadlineState = {
  status: 'open' | 'upcoming' | 'passed';
  label: string;
  compactLabel: string;
};

/**
 * Format the deadline once on the server so the client does not render a
 * different countdown during hydration. `now` is injectable for deterministic
 * tests and preview fixtures.
 */
export function formatDeadlineState(
  deadline: Date | null | undefined,
  now = new Date(),
): DeadlineState {
  if (!deadline) {
    return {
      status: 'open',
      label: 'Registration is open',
      compactLabel: 'OPEN',
    };
  }

  const remainingMs = deadline.getTime() - now.getTime();
  if (remainingMs <= 0) {
    return {
      status: 'passed',
      label: 'Registration is closed',
      compactLabel: 'CLOSED',
    };
  }

  const totalMinutes = Math.max(1, Math.floor(remainingMs / 60_000));
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: string[] = [];

  if (days > 0) parts.push(`${days}D`);
  if (hours > 0 || days > 0) parts.push(`${hours}H`);
  if (days === 0 && hours === 0) parts.push(`${minutes}M`);

  return {
    status: 'upcoming',
    label: `Registration closes ${formatDeadline(deadline)}`,
    compactLabel: `${parts.join(' ')} LEFT`,
  };
}

export function toDateTimeLocalValue(deadline: Date | null | undefined) {
  return deadline ? deadline.toISOString().slice(0, 16) : '';
}
