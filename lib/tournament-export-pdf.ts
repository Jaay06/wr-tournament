import fontkit from "@pdf-lib/fontkit";
import { PDFDocument, rgb, type PDFFont, type PDFPage } from "pdf-lib";

import type { ExportTable } from "@/lib/tournament-export";

const pageWidth = 842;
const pageHeight = 595;
const margin = 36;
const tableWidth = pageWidth - margin * 2;
const rowHeight = 27;

type Column = { index: number; label: string; width: number };

const playerColumns: Column[] = [
  { index: 0, label: "PLAYER", width: 125 },
  { index: 1, label: "RIOT ID", width: 148 },
  { index: 2, label: "RANK", width: 108 },
  { index: 3, label: "TIER", width: 55 },
  { index: 5, label: "PRIMARY", width: 88 },
  { index: 6, label: "SECONDARY", width: 88 },
  { index: 7, label: "TEAM", width: 158 },
];

const teamColumns: Column[] = [
  { index: 0, label: "TEAM", width: 135 },
  { index: 1, label: "STATUS", width: 76 },
  { index: 3, label: "PLAYER", width: 125 },
  { index: 4, label: "RIOT ID", width: 145 },
  { index: 5, label: "CAPTAIN", width: 64 },
  { index: 6, label: "TIER", width: 55 },
  { index: 7, label: "LINEUP", width: 90 },
  { index: 8, label: "ROLE", width: 80 },
];

const ink = rgb(0.08, 0.12, 0.19);
const muted = rgb(0.34, 0.4, 0.48);
const border = rgb(0.84, 0.87, 0.91);
const pale = rgb(0.95, 0.97, 0.99);
const accent = rgb(0.13, 0.34, 0.67);

function supportedText(value: string, font: PDFFont) {
  const characters = new Set(font.getCharacterSet());
  return [...value].map((character) => characters.has(character.codePointAt(0)!) ? character : "?").join("");
}

function fitText(value: string, font: PDFFont, size: number, width: number) {
  const safe = supportedText(value, font);
  if (font.widthOfTextAtSize(safe, size) <= width) return safe;
  let clipped = safe;
  while (clipped && font.widthOfTextAtSize(`${clipped}...`, size) > width) {
    clipped = clipped.slice(0, -1);
  }
  return `${clipped}...`;
}

function drawPageHeader(page: PDFPage, table: ExportTable, font: PDFFont, bold: PDFFont, date: Date) {
  page.drawText("RIFT CLASH  /  ORGANIZER EXPORT", { x: margin, y: pageHeight - 39, font: bold, size: 9, color: accent });
  page.drawText(table.title, { x: margin, y: pageHeight - 77, font: bold, size: 24, color: ink });
  const summary = `${table.rows.length} ${table.title === "Teams" ? "roster entries" : "players"}  |  Generated ${date.toISOString().slice(0, 10)}`;
  page.drawText(summary, { x: margin, y: pageHeight - 95, font, size: 9, color: muted });
}

function drawTableHeader(page: PDFPage, columns: Column[], bold: PDFFont, top: number) {
  page.drawRectangle({ x: margin, y: top - rowHeight, width: tableWidth, height: rowHeight, color: ink });
  let x = margin;
  for (const column of columns) {
    page.drawText(column.label, { x: x + 8, y: top - 17, font: bold, size: 7.5, color: rgb(1, 1, 1) });
    x += column.width;
  }
}

export async function exportTableToPdf(table: ExportTable, regularBytes: Uint8Array, boldBytes: Uint8Array, date = new Date()) {
  const pdf = await PDFDocument.create();
  pdf.registerFontkit(fontkit);
  const font = await pdf.embedFont(regularBytes);
  const bold = await pdf.embedFont(boldBytes);
  const columns = table.title === "Teams" ? teamColumns : playerColumns;
  let page: PDFPage | undefined;
  let y = 0;

  function addPage() {
    page = pdf.addPage([pageWidth, pageHeight]);
    drawPageHeader(page, table, font, bold, date);
    drawTableHeader(page, columns, bold, pageHeight - 117);
    y = pageHeight - 117 - rowHeight;
  }

  addPage();
  if (table.rows.length === 0) {
    page!.drawText("No records to export yet.", { x: margin + 8, y: y - 24, font, size: 11, color: muted });
  }

  table.rows.forEach((row, index) => {
    if (y - rowHeight < 48) addPage();
    if (index % 2 === 1) {
      page!.drawRectangle({ x: margin, y: y - rowHeight, width: tableWidth, height: rowHeight, color: pale });
    }
    page!.drawLine({ start: { x: margin, y: y - rowHeight }, end: { x: margin + tableWidth, y: y - rowHeight }, thickness: 0.5, color: border });
    let x = margin;
    for (const column of columns) {
      page!.drawText(fitText(row[column.index] || "-", font, 8.5, column.width - 16), {
        x: x + 8, y: y - 17, font, size: 8.5, color: ink,
      });
      x += column.width;
    }
    y -= rowHeight;
  });

  pdf.getPages().forEach((currentPage, index) => {
    currentPage.drawLine({ start: { x: margin, y: 37 }, end: { x: pageWidth - margin, y: 37 }, thickness: 0.6, color: border });
    currentPage.drawText("Private tournament data", { x: margin, y: 23, font, size: 8, color: muted });
    const pageLabel = `Page ${index + 1} of ${pdf.getPageCount()}`;
    currentPage.drawText(pageLabel, { x: pageWidth - margin - font.widthOfTextAtSize(pageLabel, 8), y: 23, font, size: 8, color: muted });
  });

  pdf.setTitle(`Rift Clash ${table.title}`);
  return pdf.save();
}
