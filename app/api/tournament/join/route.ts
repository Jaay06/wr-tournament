import { auth, updateSession } from "@/auth";
import { joinTournamentForUser } from "@/lib/join-tournament";

function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");

  if (!origin) {
    return true;
  }

  try {
    const requestUrl = new URL(request.url);
    const protocol =
      request.headers.get("x-forwarded-proto")?.split(",")[0].trim() ??
      requestUrl.protocol.slice(0, -1);
    const host =
      request.headers.get("x-forwarded-host")?.split(",")[0].trim() ??
      request.headers.get("host") ??
      requestUrl.host;

    return new URL(origin).origin === `${protocol}://${host}`;
  } catch {
    return false;
  }
}

async function refreshTournamentSession() {
  try {
    await updateSession({ user: { hasJoinedTournament: true } });
  } catch {
    // Tournament access is checked from the participant row on every route.
  }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) {
    return Response.json(
      {
        code: "FORBIDDEN",
        error: "This invite request could not be verified. Refresh and try again.",
      },
      { status: 403 },
    );
  }

  const session = await auth();

  if (!session?.user?.id) {
    return Response.json(
      {
        code: "UNAUTHENTICATED",
        error: "Sign in before entering the tournament.",
      },
      { status: 401 },
    );
  }

  const formData = await request.formData();
  const result = await joinTournamentForUser(
    session.user.id,
    formData.get("code"),
  );

  if (!result.ok) {
    return Response.json(
      { code: result.code, error: result.error },
      { status: result.status },
    );
  }

  await refreshTournamentSession();

  return Response.json({ redirectTo: result.redirectTo });
}
