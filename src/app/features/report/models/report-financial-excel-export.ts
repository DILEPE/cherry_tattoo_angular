import type { Worksheet } from 'exceljs';
import { Appointment, AppointmentFilters } from '../../appointments/models/appointment.model';
import { reportWorkPerformedLabel } from './work-performed-label.util';
import {
  EXCEL_COLORS,
  applyReportSubtitleRow,
  applyReportTitleRow,
  downloadExcelWorkbook,
  excelBodyFont,
  excelCenterAlign,
  excelHeaderFont,
  excelLeftAlign,
  excelRightAlign,
  excelSolidFill,
  excelThinBorder,
} from '../../../shared/export/excel-workbook.util';

const DATA_HEADERS = [
  'Cliente',
  'Artista / profesional',
  'Servicio',
  'Tipo trabajo / perforación',
  'Valor total (COP)',
  'Abonado (COP)',
  'Pendiente (COP)',
  'Estado',
] as const;

const COLUMN_WIDTHS = [34, 28, 16, 26, 16, 16, 16, 14] as const;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatGeneratedAt(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatWhen(d: Date | null, raw: string | null): string {
  if (!d) return raw ?? '';
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function excelFilenameStamp(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}-${pad2(d.getHours())}${pad2(d.getMinutes())}`;
}

export function buildReportFiltersLabel(filters: AppointmentFilters): string {
  const parts: string[] = [];
  const name = filters.nameSubstr.trim();
  if (name) parts.push(`Nombre: ${name}`);
  if (filters.service !== 'Todos') parts.push(`Servicio: ${filters.service}`);
  if (filters.status !== 'Todos') parts.push(`Estado: ${filters.status}`);
  if (filters.fromDate) parts.push(`Desde: ${filters.fromDate}`);
  if (filters.toDate) parts.push(`Hasta: ${filters.toDate}`);
  return parts.length ? parts.join(' · ') : 'Todos';
}

function appointmentToExcelRow(
  r: Appointment,
  piercingSurveyLabels: Readonly<Record<number, string>>,
): (string | number)[] {
  return [
    r.customerName,
    r.assignedLabel,
    r.serviceType,
    reportWorkPerformedLabel(r, piercingSurveyLabels),
    Math.round(r.financials.total),
    Math.round(r.financials.deposit),
    Math.round(r.financials.pending),
    r.statusLabel,
  ];
}

function setColumnWidths(ws: Worksheet, widths: readonly number[]): void {
  widths.forEach((w, i) => {
    ws.getColumn(i + 1).width = w;
  });
}

function styleDataCell(
  ws: Worksheet,
  row: number,
  col: number,
  value: string | number,
  zebra: boolean,
): void {
  const cell = ws.getCell(row, col);
  cell.value = value;
  cell.font = excelBodyFont();
  cell.fill = excelSolidFill(zebra ? EXCEL_COLORS.rowAlt : EXCEL_COLORS.rowBase);
  cell.border = excelThinBorder();
  cell.alignment = col >= 5 && col <= 7 ? excelRightAlign() : excelLeftAlign(col === 4);
}

function buildDataSheet(
  ws: Worksheet,
  rows: Appointment[],
  filtersLabel: string,
  generatedAt: Date,
  piercingSurveyLabels: Readonly<Record<number, string>>,
): void {
  const ncol = DATA_HEADERS.length;
  const fechaEtiqueta = formatGeneratedAt(generatedAt);
  const dataRows = rows.map((r) => appointmentToExcelRow(r, piercingSurveyLabels));
  const headerRow = 4;
  const firstDataRow = headerRow + 1;

  applyReportTitleRow(ws, 'Informe financiero — Citas Cherry Ink · Rock City', ncol);
  applyReportSubtitleRow(
    ws,
    `Generado: ${fechaEtiqueta}  ·  Filtros: ${filtersLabel}  ·  Registros: ${rows.length}`,
    ncol,
  );
  ws.getRow(3).height = 6;

  DATA_HEADERS.forEach((label, i) => {
    const col = i + 1;
    const cell = ws.getCell(headerRow, col);
    cell.value = label;
    cell.font = excelHeaderFont();
    cell.fill = excelSolidFill(EXCEL_COLORS.tableHeadBg);
    cell.border = excelThinBorder();
    cell.alignment = col >= 5 && col <= 7 ? excelRightAlign() : excelCenterAlign(true);
  });
  ws.getRow(headerRow).height = 24;

  if (dataRows.length) {
    dataRows.forEach((rowVals, idx) => {
      const r = firstDataRow + idx;
      const zebra = idx % 2 === 1;
      rowVals.forEach((val, colIdx) => {
        styleDataCell(ws, r, colIdx + 1, val, zebra);
      });
      ws.getRow(r).height = 20;
    });
    const lastRow = firstDataRow + dataRows.length - 1;
    ws.autoFilter = {
      from: { row: headerRow, column: 1 },
      to: { row: lastRow, column: ncol },
    };
    ws.views = [{ state: 'frozen', ySplit: headerRow, activeCell: 'A5' }];
  } else {
    ws.mergeCells(firstDataRow, 1, firstDataRow, ncol);
    const cell = ws.getCell(firstDataRow, 1);
    cell.value = 'Sin citas para los filtros actuales.';
    cell.font = excelBodyFont();
    cell.fill = excelSolidFill(EXCEL_COLORS.accentInfo);
    cell.alignment = excelCenterAlign();
    cell.border = excelThinBorder();
    ws.getRow(firstDataRow).height = 22;
    ws.views = [{ state: 'frozen', ySplit: headerRow }];
  }

  setColumnWidths(ws, COLUMN_WIDTHS);
}

function buildSummarySheet(
  ws: Worksheet,
  rows: Appointment[],
  filtersLabel: string,
  generatedAt: Date,
): void {
  const fechaEtiqueta = formatGeneratedAt(generatedAt);
  let trabajo = 0;
  let abonado = 0;
  let pendiente = 0;
  for (const r of rows) {
    trabajo += r.financials.total;
    abonado += r.financials.deposit;
    pendiente += r.financials.pending;
  }
  const ncol = 2;

  applyReportTitleRow(ws, 'Resumen financiero — mismos filtros que el panel', ncol);
  applyReportSubtitleRow(ws, `Generado: ${fechaEtiqueta}`, ncol);
  ws.getRow(3).height = 6;

  const headerRow = 4;
  ['Concepto', 'Valor'].forEach((label, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = label;
    cell.font = { ...excelHeaderFont(), color: { argb: EXCEL_COLORS.headerText } };
    cell.fill = excelSolidFill(EXCEL_COLORS.headerBg);
    cell.border = excelThinBorder();
    cell.alignment = i === 0 ? excelLeftAlign() : excelRightAlign();
  });
  ws.getRow(headerRow).height = 22;

  const metrics: [string, string | number][] = [
    ['Total valor trabajo (COP)', Math.round(trabajo)],
    ['Total abonado (COP)', Math.round(abonado)],
    ['Total pendiente (COP)', Math.round(pendiente)],
    ['Cantidad de citas', rows.length],
    ['Filtros aplicados', filtersLabel],
  ];

  metrics.forEach(([label, value], idx) => {
    const r = headerRow + 1 + idx;
    const zebra = idx % 2 === 1;
    const fill = excelSolidFill(zebra ? EXCEL_COLORS.rowAlt : EXCEL_COLORS.rowBase);

    const c1 = ws.getCell(r, 1);
    c1.value = label;
    c1.font = excelBodyFont();
    c1.fill = fill;
    c1.border = excelThinBorder();
    c1.alignment = excelLeftAlign();

    const c2 = ws.getCell(r, 2);
    c2.value = value;
    c2.font = { ...excelBodyFont(), bold: typeof value === 'number' };
    c2.fill = fill;
    c2.border = excelThinBorder();
    c2.alignment = excelRightAlign();
    ws.getRow(r).height = 20;
  });

  ws.getColumn(1).width = 44;
  ws.getColumn(2).width = 28;
}

/** Genera y descarga el informe XLSX del listado financiero filtrado. */
export async function downloadReportFinancialExcel(
  rows: Appointment[],
  filters: AppointmentFilters,
  piercingSurveyLabels: Readonly<Record<number, string>> = {},
  generatedAt: Date = new Date(),
): Promise<void> {
  const filtersLabel = buildReportFiltersLabel(filters);
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'Cherry Ink · Rock City';
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.title = 'Informe financiero citas';

  const wsData = workbook.addWorksheet('Datos financieros', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });
  buildDataSheet(wsData, rows, filtersLabel, generatedAt, piercingSurveyLabels);

  const wsSummary = workbook.addWorksheet('Resumen financiero', {
    properties: { defaultRowHeight: 18 },
  });
  buildSummarySheet(wsSummary, rows, filtersLabel, generatedAt);

  const filename = `Informe-finanzas-citas-${excelFilenameStamp(generatedAt)}.xlsx`;
  await downloadExcelWorkbook(() => workbook.xlsx.writeBuffer(), filename);
}

/** Etiqueta de fecha para columnas opcionales en UI. */
export { formatWhen };
