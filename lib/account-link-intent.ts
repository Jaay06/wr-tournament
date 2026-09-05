import { createHash, createHmac, timingSafeEqual } from 'node:crypto';

export const ACCOUNT_LINK_INTENT_COOKIE = 'account-link-intent';
export const ACCOUNT_LINK_INTENT_MAX_AGE = 10 * 60;

type AccountLinkIntent = {
  userId: string;
  sessionHash: string;
  expiresAt: number;
};

function signingSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error('AUTH_SECRET must be configured for account linking.');
  }

  return secret;
}

function sessionHash(sessionId: string) {
  return createHash('sha256').update(sessionId).digest('base64url');
}

function sign(value: string) {
  return createHmac('sha256', signingSecret()).update(value).digest('base64url');
}

export function createAccountLinkIntent({
  userId,
  sessionId,
}: {
  userId: string;
  sessionId: string;
}) {
  const payload: AccountLinkIntent = {
    userId,
    sessionHash: sessionHash(sessionId),
    expiresAt: Date.now() + ACCOUNT_LINK_INTENT_MAX_AGE * 1000,
  };
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString(
    'base64url',
  );

  return `${encodedPayload}.${sign(encodedPayload)}`;
}

export function verifyAccountLinkIntent(
  value: string | undefined,
  sessionId: string | undefined,
) {
  if (!value || !sessionId) return null;

  const parts = value.split('.');
  if (parts.length !== 2) return null;

  const [encodedPayload, signature] = parts;
  if (!encodedPayload || !signature) return null;

  const expectedSignature = sign(encodedPayload);
  const signatureMatches =
    signature.length === expectedSignature.length &&
    timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature),
    );

  if (!signatureMatches) return null;

  try {
    const payload = JSON.parse(
      Buffer.from(encodedPayload, 'base64url').toString('utf8'),
    ) as Partial<AccountLinkIntent>;

    if (
      typeof payload.userId !== 'string' ||
      typeof payload.sessionHash !== 'string' ||
      typeof payload.expiresAt !== 'number' ||
      payload.expiresAt <= Date.now() ||
      payload.sessionHash !== sessionHash(sessionId)
    ) {
      return null;
    }

    return {
      userId: payload.userId,
      expiresAt: payload.expiresAt,
    } satisfies Pick<AccountLinkIntent, 'userId' | 'expiresAt'>;
  } catch {
    return null;
  }
}
