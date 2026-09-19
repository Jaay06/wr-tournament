import { getToken } from "next-auth/jwt";
import { type NextRequest, NextResponse } from "next/server";

import { getDraftPollState } from "@/lib/draft-poll-data";

const privateHeaders = { "Cache-Control": "private, no-store, max-age=0", Vary: "Cookie" };

export async function GET(request: NextRequest) {
  // Auth.js still verifies/decrypts the JWT, including expiry and chunked
  // cookies. Avoid running OAuth configuration and re-encoding a session for
  // every poll; the database below remains authoritative for role and access.
  const secureCookie = request.cookies.getAll().some(({ name }) =>
    name === "__Secure-authjs.session-token" || name.startsWith("__Secure-authjs.session-token."));
  const token = await getToken({
    req: request,
    secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
    secureCookie,
  });
  const state = token?.sub ? await getDraftPollState(token.sub) : null;
  if (!state) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", error: "Sign in before viewing the draft." },
      { status: 401, headers: privateHeaders },
    );
  }

  if (!state.participant_id) {
    return NextResponse.json(
      { code: "TOURNAMENT_ACCESS_REQUIRED", error: "Join the tournament before viewing the draft." },
      { status: 403, headers: privateHeaders },
    );
  }

  const etag = state.revision ? `"${state.revision}"` : null;
  // Cloudflare compression can weaken an ETag. GET uses weak comparison,
  // so either representation of this revision means the board is unchanged.
  const matchesRevision = request.headers.get("if-none-match")?.split(",")
    .some(value => value.trim().replace(/^W\//, "") === etag);
  if (!state.needs_reconciliation && etag && matchesRevision) {
    return new Response(null, { status: 304, headers: { ...privateHeaders, ETag: etag } });
  }
  const board = state.session_id
    ? await (await import("@/lib/draft-data")).getDraftBoardData(state.user_id, {
        isOrganizer: state.role === "organizer",
        reconcileExpired: state.needs_reconciliation,
      })
    : null;
  if (!board) {
    return NextResponse.json(
      { code: "DRAFT_NOT_STARTED", error: "The organizer has not started a draft." },
      { status: 404, headers: privateHeaders },
    );
  }

  return NextResponse.json(board, {
    headers: {
      ...privateHeaders,
      // This revision precedes the read. A concurrent change can cause an
      // extra full response next time, but cannot label old data as current.
      ...(!state.needs_reconciliation && etag ? { ETag: etag } : {}),
    },
  });
}
