import { NextRequest, NextResponse } from 'next/server';
import { handlers } from '@/auth';
import { ACCOUNT_LINK_INTENT_COOKIE } from '@/lib/account-link-intent';
import { discordFailureRedirect } from '@/lib/discord-error';

export const POST = handlers.POST;

export async function GET(request: NextRequest) {
  const response = await handlers.GET(request);
  const linking = request.cookies.has(ACCOUNT_LINK_INTENT_COOKIE);
  const target = discordFailureRedirect(request.url, response.headers.get('location'), linking);
  if (!target) return response;

  const redirected = NextResponse.redirect(target);
  for (const cookie of response.headers.getSetCookie()) {
    redirected.headers.append('set-cookie', cookie);
  }
  if (linking) redirected.cookies.delete(ACCOUNT_LINK_INTENT_COOKIE);
  return redirected;
}
