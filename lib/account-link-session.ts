import { cookies, headers } from 'next/headers';
import { getToken } from 'next-auth/jwt';

// Decode through Auth.js so encrypted and chunked session cookies are supported.
export async function getAccountLinkSession() {
  const cookieStore = await cookies();
  const secureCookie = cookieStore.getAll().some(({ name }) =>
    name === '__Secure-authjs.session-token' || name.startsWith('__Secure-authjs.session-token.'),
  );
  const token = await getToken({
    req: { headers: await headers() },
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie,
  });
  if (!token?.sub || typeof token.linkSessionId !== 'string') return null;
  return { userId: token.sub, sessionId: token.linkSessionId };
}
