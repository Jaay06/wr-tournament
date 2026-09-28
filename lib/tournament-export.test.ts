import assert from "node:assert/strict";
import { test } from "node:test";

import { exportTableToCsv } from "./tournament-export";

test("CSV preserves multiline data and prevents spreadsheet formulas", () => {
  const csv = exportTableToCsv({
    title: "Players",
    headers: ["Player", "Team"],
    rows: [["Élodie, Jr.", "Night\nSentinels"], [" =SUM(1,1)", '"Raiders"']],
  });

  assert.equal(
    csv,
    '\uFEFF"Player","Team"\r\n"Élodie, Jr.","Night\nSentinels"\r\n"\' =SUM(1,1)","""Raiders"""\r\n',
  );
});
