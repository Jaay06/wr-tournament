import assert from 'node:assert/strict';
import test from 'node:test';
import { discordErrorMessage, discordFailureRedirect } from './discord-error';

test('Discord denial returns to connected accounts with its provider error', () => {
  const result = discordFailureRedirect('http://localhost:3000/api/auth/callback/discord?error=access_denied', '/api/auth/error?error=OAuthCallbackError', true);
  assert.equal(result?.pathname, '/tournament/account');
  assert.equal(result?.searchParams.get('error'), 'access_denied');
  assert.match(discordErrorMessage('access_denied'), /cancelled or denied/);
});

test('server failures are visible and successful callbacks are unchanged', () => {
  assert.equal(discordFailureRedirect('http://localhost:3000/api/auth/callback/discord', '/tournament/account?linked=1', true), null);
  assert.equal(discordFailureRedirect('http://localhost:3000/api/auth/callback/discord', '/api/auth/error?error=Configuration', false)?.pathname, '/signin');
  assert.match(discordErrorMessage('Configuration'), /configuration error/);
  assert.doesNotMatch(discordErrorMessage('<script>private details</script>'), /private details/);
});
