import type { Worksheet } from 'exceljs';
import {
  applyReportSubtitleRow,
  applyReportTitleRow,
  downloadExcelWorkbook,
  excelBodyFont,
  excelHeaderFont,
  excelSolidFill,
  excelThinBorder,
  EXCEL_COLORS,
} from '../../../shared/export/excel-workbook.util';
import { SurveyQuestionTextResponseRow } from './survey-stats.model';

function excelFilenameStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function slugLabel(label: string): string {
  return String(label ?? 'pregunta')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 40);
}

function writeResponsesSheet(
  ws: Worksheet,
  questionLabel: string,
  rows: SurveyQuestionTextResponseRow[],
  dateFilterLabel: string,
): void {
  const colCount = 2;
  const generatedAt = new Date();
  applyReportTitleRow(ws, `Respuestas de texto — ${questionLabel}`, colCount);
  applyReportSubtitleRow(
    ws,
    `Generado: ${generatedAt.toLocaleString('es-CO')} · ${dateFilterLabel}`,
    colCount,
  );

  ws.getColumn(1).width = 14;
  ws.getColumn(2).width = 64;

  const headerRow = 4;
  ['ID usuario', 'Respuesta'].forEach((h, col) => {
    const cell = ws.getCell(headerRow, col + 1);
    cell.value = h;
    cell.font = excelHeaderFont();
    cell.fill = excelSolidFill(EXCEL_COLORS.tableHeadBg);
    cell.border = excelThinBorder();
  });

  let r = headerRow + 1;
  for (const row of rows) {
    const idVal = row.customer_id != null ? row.customer_id : '—';
    [idVal, row.response_text].forEach((val, col) => {
      const cell = ws.getCell(r, col + 1);
      cell.value = val;
      cell.font = excelBodyFont();
      cell.fill = excelSolidFill((r - headerRow) % 2 === 0 ? EXCEL_COLORS.rowAlt : EXCEL_COLORS.rowBase);
      cell.border = excelThinBorder();
      if (col === 1) cell.alignment = { wrapText: true, vertical: 'top' };
    });
    ws.getRow(r).height = Math.min(120, Math.max(18, Math.ceil(row.response_text.length / 70) * 14));
    r++;
  }
}

export async function downloadSurveyTextResponsesExcel(
  questionId: number,
  questionLabel: string,
  rows: SurveyQuestionTextResponseRow[],
  dateFilterLabel = 'Todas las fechas',
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Respuestas', { views: [{ showGridLines: false }] });
  writeResponsesSheet(ws, questionLabel, rows, dateFilterLabel);
  const stamp = excelFilenameStamp(new Date());
  const slug = slugLabel(questionLabel);
  const filename = `Encuesta-texto-${questionId}-${slug}-${stamp}.xlsx`;
  await downloadExcelWorkbook(() => workbook.xlsx.writeBuffer(), filename);
}
