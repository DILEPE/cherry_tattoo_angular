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
import {
  CONTRACT_KIND_LABEL_ES,
  SURVEY_TYPE_LABEL_ES,
  SurveyQuestionStatRow,
} from './survey-stats.model';
import {
  surveyChartEntries,
  surveyChartTotal,
  surveyChartVariant,
} from './survey-chart.util';
import { renderSurveyChartPngBase64 } from './survey-chart-canvas.util';

function excelFilenameStamp(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;
}

function formatWhen(d: Date): string {
  return d.toLocaleString('es-CO', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
}

function typeLabel(t: string): string {
  return SURVEY_TYPE_LABEL_ES[t] ?? t;
}

function kindLabel(k: string): string {
  return CONTRACT_KIND_LABEL_ES[k] ?? k;
}

function addBreakdownTable(
  ws: Worksheet,
  startRow: number,
  entries: { key: string; count: number }[],
): number {
  const total = surveyChartTotal(entries);
  const headers = ['Respuesta', 'Cantidad', '%'];
  const headerRow = startRow;
  headers.forEach((h, col) => {
    const cell = ws.getCell(headerRow, col + 1);
    cell.value = h;
    cell.font = excelHeaderFont();
    cell.fill = excelSolidFill(EXCEL_COLORS.tableHeadBg);
    cell.border = excelThinBorder();
  });

  let r = headerRow + 1;
  for (const e of entries) {
    const pct = total > 0 ? ((e.count / total) * 100).toFixed(1) : '0.0';
    [e.key, e.count, `${pct}%`].forEach((val, col) => {
      const cell = ws.getCell(r, col + 1);
      cell.value = val;
      cell.font = excelBodyFont();
      cell.fill = excelSolidFill((r - headerRow) % 2 === 0 ? EXCEL_COLORS.rowAlt : EXCEL_COLORS.rowBase);
      cell.border = excelThinBorder();
    });
    r++;
  }
  return r;
}

export async function downloadSurveyStatsExcel(
  rows: SurveyQuestionStatRow[],
  dateFilterLabel = 'Todas las fechas',
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  const ws = workbook.addWorksheet('Encuestas', {
    views: [{ showGridLines: false }],
  });

  const colCount = 3;
  const generatedAt = new Date();
  applyReportTitleRow(ws, 'Informe de encuestas — satisfacción', colCount);
  applyReportSubtitleRow(
    ws,
    `Generado: ${formatWhen(generatedAt)} · ${dateFilterLabel}`,
    colCount,
  );

  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 12;
  ws.getColumn(3).width = 10;

  let row = 4;

  for (const q of rows) {
    const entries = surveyChartEntries(q);
    const meta = `${q.label} · ${typeLabel(q.question_type)} · ${kindLabel(q.contract_kind)} · n=${q.response_count}`;

    ws.mergeCells(row, 1, row, colCount);
    const titleCell = ws.getCell(row, 1);
    titleCell.value = meta;
    titleCell.font = { ...excelBodyFont(), bold: true, size: 11 };
    titleCell.fill = excelSolidFill(EXCEL_COLORS.brandSoft);
    titleCell.border = excelThinBorder(EXCEL_COLORS.borderLight);
    ws.getRow(row).height = 22;
    row++;

    const metrics: string[] = [];
    if (q.question_type === 'rating_1_5' && q.avg_rating != null) {
      metrics.push(`Promedio (1–5): ${Number(q.avg_rating).toFixed(2)}`);
    }
    if (q.question_type === 'yes_no') {
      metrics.push(`Sí: ${q.yes_count ?? 0} · No: ${q.no_count ?? 0}`);
    }
    if (q.question_type === 'number' && q.avg_number != null) {
      metrics.push(`Promedio numérico: ${Number(q.avg_number).toFixed(4)}`);
    }
    if (metrics.length) {
      ws.mergeCells(row, 1, row, colCount);
      ws.getCell(row, 1).value = metrics.join(' · ');
      ws.getCell(row, 1).font = excelBodyFont();
      row++;
    }

    if (entries.length) {
      const base64 = renderSurveyChartPngBase64(entries, surveyChartVariant(q), q.label);
      if (base64) {
        const imageId = workbook.addImage({ base64, extension: 'png' });
        const imgRows = 14;
        ws.addImage(imageId, {
          tl: { col: 0, row: row - 1 },
          ext: { width: 480, height: 280 },
        });
        row += imgRows;
      }
      row = addBreakdownTable(ws, row, entries) + 1;
    } else if (
      ['text', 'textarea', 'text_short'].includes(q.question_type)
    ) {
      ws.mergeCells(row, 1, row, colCount);
      ws.getCell(row, 1).value = `Texto libre — respuestas no vacías: ${q.text_response_count ?? 0}`;
      ws.getCell(row, 1).font = excelBodyFont();
      row += 2;
    } else {
      row++;
    }
  }

  const filename = `Informe-encuestas-${excelFilenameStamp(generatedAt)}.xlsx`;
  await downloadExcelWorkbook(() => workbook.xlsx.writeBuffer(), filename);
}

export { formatWhen };
