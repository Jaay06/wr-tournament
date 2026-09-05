const messages: Record<string, string> = {
  access_denied: 'Discord authorization was cancelled or denied. Try again and authorize Rift Clash to connect your account.',
  invalid_request: 'Discord rejected the authorization request. Please contact the organizer.',
  invalid_scope: 'Discord rejected the requested permissions. Please contact the organizer.',
  unauthorized_client: 'Discord has not authorized this application. Please contact the organizer.',
  server_error: 'Discord encountered a server error. Please try again later.',
  temporarily_unavailable: 'Discord is temporarily unavailable. Please try again later.',
  OAuthCallbackError: 'Discord could not complete authorization. Please try connecting again.',
  OAuthSignin: 'The app could not start Discord authorization. Please try again.',
  AccessDenied: 'Discord authorization was denied. Please try again.',
  Configuration: 'Discord sign-in could not be completed because of a server configuration error. Please contact the organizer.',
  DiscordUnavailable: 'Discord sign-in is not configured. Please contact the organizer.',
};

export function discordErrorMessage(code: string) {
  return messages[code]
    ? `${messages[code]} Error code: ${code}.`
    : 'Discord sign-in could not be completed. Please try again or contact the organizer.';
}

export function discordFailureRedirect(
  requestUrl: string,
  responseLocation: string | null,
  linking: boolean,
) {
  const request = new URL(requestUrl);
  if (!request.pathname.endsWith('/callback/discord') || !responseLocation) return null;
  const destination = new URL(responseLocation, request.origin);
  const error = destination.searchParams.get('error');
  if (destination.origin !== request.origin || !error) return null;
  const providerError = request.searchParams.get('error');
  const code = providerError && Object.hasOwn(messages, providerError) ? providerError : error;
  const target = new URL(linking ? '/tournament/account' : '/signin', request.origin);
  target.searchParams.set('error', code);
  return target;
}
