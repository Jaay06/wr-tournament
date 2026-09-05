import assert from 'node:assert/strict';
import test from 'node:test';
import { encode, decode } from 'next-auth/jwt';
import { createAccountLinkIntent, verifyAccountLinkIntent } from './account-link-intent';

test('link intent survives Auth.js cookie refresh but rejects another session', async () => {
  process.env.AUTH_SECRET = 'test-only-account-link-secret';
  const options = { secret: process.env.AUTH_SECRET, salt: 'authjs.session-token', token: { sub: 'test-user', linkSessionId: 'stable-session' } };
  const first = await encode(options);
  const refreshed = await encode(options);
  assert.notEqual(first, refreshed);
  const original = await decode({ ...options, token: first });
  const current = await decode({ ...options, token: refreshed });
  const intent = createAccountLinkIntent({ userId: 'test-user', sessionId: original!.linkSessionId as string });
  assert.equal(verifyAccountLinkIntent(intent, current!.linkSessionId as string)?.userId, 'test-user');
  assert.equal(verifyAccountLinkIntent(intent, 'different-session'), null);
  assert.equal(verifyAccountLinkIntent(`${intent}tampered`, 'stable-session'), null);
  assert.equal(verifyAccountLinkIntent(intent, undefined), null);
});
