import type {
  TournamentPlayerProfileData,
  TournamentTeamData,
} from "@/lib/tournament-types";

export type ExportTable = {
  title: string;
  headers: string[];
  rows: string[][];
};

export function playerExportTable(players: TournamentPlayerProfileData[]): ExportTable {
  return {
    title: "Players",
    headers: ["Player", "Riot ID", "Current rank", "Tier", "Tier status", "Primary role", "Secondary role", "Team"],
    rows: players.map((player) => [
      player.displayName,
      `${player.riotName}#${player.riotTag}`,
      player.currentRank,
      player.approvedTier ?? "",
      player.tierStatus,
      player.primaryRole,
      player.secondaryRole,
      player.team?.name ?? "",
    ]),
  };
}

export function teamExportTable(teams: TournamentTeamData[]): ExportTable {
  return {
    title: "Teams",
    headers: ["Team", "Status", "Submitted at", "Player", "Riot ID", "Captain", "Tier", "Lineup", "Starter role", "Primary role", "Secondary role"],
    rows: teams.flatMap((team) =>
      team.members.map((member) => [
        team.name,
        team.status,
        team.submittedAt ?? "",
        member.displayName,
        `${member.riotName}#${member.riotTag}`,
        member.isCaptain ? "Yes" : "No",
        member.approvedTier ?? "",
        member.lineupPosition,
        member.starterRole ?? "",
        member.primaryRole,
        member.secondaryRole,
      ]),
    ),
  };
}

function csvCell(value: string) {
  // Spreadsheet apps may evaluate a cell that starts with a formula marker.
  const safe = /^[\s]*[=+\-@]/u.test(value) ? `'${value}` : value;
  return `"${safe.replaceAll('"', '""')}"`;
}

export function exportTableToCsv(table: ExportTable) {
  return `\uFEFF${[table.headers, ...table.rows].map((row) => row.map(csvCell).join(",")).join("\r\n")}\r\n`;
}
