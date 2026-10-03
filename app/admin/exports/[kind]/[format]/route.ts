import { auth } from "@/auth";
import { db } from "@/db";
import { tournamentParticipants, users } from "@/db/schema";
import { getAllTeamDetails, getPlayerDirectory } from "@/lib/tournament-data";
import {
  exportTableToCsv,
  playerExportTable,
  teamExportTable,
} from "@/lib/tournament-export";
import { exportTableToPdf } from "@/lib/tournament-export-pdf";
import { boldFontBase64, regularFontBase64 } from "@/lib/tournament-export-fonts";
import { and, eq, isNull } from "drizzle-orm";

type Params = { kind: string; format: string };

export async function GET(_request: Request, { params }: { params: Promise<Params> }) {
  const session = await auth();
  if (!session?.user?.id) return new Response("Sign in required", { status: 401 });
  if (session.user.role !== "organizer") return new Response("Organizer access required", { status: 403 });

  const { kind, format } = await params;
  if ((kind !== "players" && kind !== "teams") || (format !== "csv" && format !== "pdf")) {
    return new Response("Export not found", { status: 404 });
  }

  const [participant] = await db
    .select({ id: tournamentParticipants.id })
    .from(tournamentParticipants)
    .innerJoin(users, eq(tournamentParticipants.userId, users.id))
    .where(and(eq(tournamentParticipants.userId, session.user.id), isNull(users.deletedAt)))
    .limit(1);
  if (!participant) return new Response("Tournament access required", { status: 403 });

  const table = kind === "players"
    ? playerExportTable(await getPlayerDirectory())
    : teamExportTable(await getAllTeamDetails());
  const filename = `rift-clash-${kind}-${new Date().toISOString().slice(0, 10)}.${format}`;
  const headers = {
    "Cache-Control": "private, no-store",
    "Content-Disposition": `attachment; filename="${filename}"`,
    "X-Content-Type-Options": "nosniff",
  };

  if (format === "csv") {
    return new Response(exportTableToCsv(table), {
      headers: { ...headers, "Content-Type": "text/csv; charset=utf-8" },
    });
  }

  const regularBytes = Uint8Array.from(Buffer.from(regularFontBase64, "base64"));
  const boldBytes = Uint8Array.from(Buffer.from(boldFontBase64, "base64"));
  const pdf = await exportTableToPdf(table, regularBytes, boldBytes);
  return new Response(new Uint8Array(pdf), {
    headers: { ...headers, "Content-Type": "application/pdf" },
  });
}
