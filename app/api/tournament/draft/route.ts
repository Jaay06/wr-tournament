import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants, users } from "@/db/schema";
import { getDraftBoardData } from "@/lib/draft-data";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", error: "Sign in before viewing the draft." },
      { status: 401 },
    );
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(
      and(
        eq(tournamentParticipants.userId, session.user.id),
        isNull(users.deletedAt),
      ),
    )
    .limit(1);
  if (!participant) {
    return NextResponse.json(
      { code: "TOURNAMENT_ACCESS_REQUIRED", error: "Join the tournament before viewing the draft." },
      { status: 403 },
    );
  }

  const board = await getDraftBoardData(session.user.id, {
    isOrganizer: session.user.role === "organizer",
  });
  if (!board) {
    return NextResponse.json(
      { code: "DRAFT_NOT_STARTED", error: "The organizer has not started a draft." },
      { status: 404 },
    );
  }

  return NextResponse.json(board, {
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
