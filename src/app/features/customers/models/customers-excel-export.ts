import type { Worksheet } from 'exceljs';
import { Customer } from './customer.model';
import { formatBirthDateDisplay } from './customer.mapper';
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

export const CUSTOMERS_EXCEL_HEADERS: readonly string[] = [
  'ID',
  'Nombres',
  'Apellidos',
  'Fecha nacimiento',
  'Tipo documento',
  'Número documento',
  'Fecha expedición documento',
  'Correo',
  'Teléfono',
  'Dirección',
  'Nacionalidad',
  'Profesión',
  'Redes sociales',
  'Contacto emergencia (nombre)',
  'Contacto emergencia (teléfono)',
  'Menor de edad',
  'Tutor (nombre)',
  'Tutor (tipo documento)',
  'Tutor (número documento)',
  'Tutor (fecha expedición)',
  'Fecha registro',
  'Última actualización',
] as const;

const COLUMN_WIDTHS = [
  8, 18, 18, 14, 12, 16, 16, 28, 14, 32, 14, 18, 22, 22, 18, 10, 22, 14, 16, 16, 18, 18,
] as const;

/** Columnas con alineación centrada (índice 1-based). */
const CENTER_COLS = new Set([1, 4, 5, 16, 18, 20, 21, 22]);

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}

function formatGeneratedAt(d: Date): string {
  return `${pad2(d.getDate())}/${pad2(d.getMonth() + 1)}/${d.getFullYear()} ${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}

function formatDateIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!m) return iso;
  return `${m[3]}/${m[2]}/${m[1]}`;
}

function formatDateTimeIso(iso: string | null | undefined): string {
  if (!iso) return '';
  const s = iso.trim().replace('T', ' ');
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/.exec(s);
  if (!m) return s.slice(0, 16);
  const date = `${m[3]}/${m[2]}/${m[1]}`;
  if (m[4] != null && m[5] != null) return `${date} ${m[4]}:${m[5]}`;
  return date;
}

function yesNoMinor(isMinor: boolean): string {
  return isMinor ? 'Sí' : 'No';
}

export function customerToExcelRow(c: Customer): (string | number)[] {
  return [
    c.id,
    c.firstName.trim(),
    c.lastName.trim(),
    formatBirthDateDisplay(c.birthDate, c.birthDatePending),
    c.documentType,
    c.documentNumber.trim(),
    formatDateIso(c.documentIssueDate),
    c.email.trim(),
    c.phoneNumber.trim(),
    c.address?.trim() ?? '',
    c.nationality?.trim() ?? '',
    c.profession?.trim() ?? '',
    c.socialMedia?.trim() ?? '',
    c.emergencyContactName?.trim() ?? '',
    c.emergencyContactPhone?.trim() ?? '',
    yesNoMinor(c.isMinor),
    c.guardianName?.trim() ?? '',
    c.guardianDocumentType ?? '',
    c.guardianDocumentNumber?.trim() ?? '',
    formatDateIso(c.guardianDocumentIssueDate),
    formatDateTimeIso(c.createdAt),
    formatDateTimeIso(c.updatedAt),
  ];
}

function excelFilenameStamp(d: Date): string {
  const y = d.getFullYear();
  const mo = pad2(d.getMonth() + 1);
  const day = pad2(d.getDate());
  const h = pad2(d.getHours());
  const mi = pad2(d.getMinutes());
  return `${y}-${mo}-${day}-${h}${mi}`;
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
  cell.alignment = CENTER_COLS.has(col) ? excelCenterAlign() : excelLeftAlign(col === 10);
}

function buildClientsSheet(
  ws: Worksheet,
  rows: Customer[],
  searchLabel: string,
  generatedAt: Date,
): void {
  const ncol = CUSTOMERS_EXCEL_HEADERS.length;
  const fechaEtiqueta = formatGeneratedAt(generatedAt);
  const filtro = (searchLabel || '').trim() || 'Todos';
  const dataRows = rows.map(customerToExcelRow);
  const headerRow = 4;
  const firstDataRow = headerRow + 1;

  applyReportTitleRow(ws, 'Informe de clientes — Cherry Ink · Rock City', ncol);
  applyReportSubtitleRow(
    ws,
    `Generado: ${fechaEtiqueta}  ·  Filtro de búsqueda: ${filtro}  ·  Registros: ${rows.length}`,
    ncol,
  );
  ws.getRow(3).height = 6;

  CUSTOMERS_EXCEL_HEADERS.forEach((label, i) => {
    const col = i + 1;
    const cell = ws.getCell(headerRow, col);
    cell.value = label;
    cell.font = excelHeaderFont();
    cell.fill = excelSolidFill(EXCEL_COLORS.tableHeadBg);
    cell.border = excelThinBorder();
    cell.alignment = excelCenterAlign(true);
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
    cell.value = 'Sin clientes para el filtro actual.';
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
  rows: Customer[],
  searchLabel: string,
  generatedAt: Date,
): void {
  const fechaEtiqueta = formatGeneratedAt(generatedAt);
  const filtro = (searchLabel || '').trim() || 'Todos';
  const menores = rows.filter((c) => c.isMinor).length;
  const ncol = 2;

  applyReportTitleRow(ws, 'Resumen del informe', ncol);
  applyReportSubtitleRow(ws, `Generado: ${fechaEtiqueta}`, ncol);
  ws.getRow(3).height = 6;

  const headerRow = 4;
  const labels = ['Concepto', 'Valor'];
  labels.forEach((label, i) => {
    const cell = ws.getCell(headerRow, i + 1);
    cell.value = label;
    cell.font = { ...excelHeaderFont(), color: { argb: EXCEL_COLORS.headerText } };
    cell.fill = excelSolidFill(EXCEL_COLORS.headerBg);
    cell.border = excelThinBorder();
    cell.alignment = i === 0 ? excelLeftAlign() : excelRightAlign();
  });
  ws.getRow(headerRow).height = 22;

  const metrics: [string, string | number][] = [
    ['Total clientes exportados', rows.length],
    ['Menores de edad', menores],
    ['Adultos', Math.max(rows.length - menores, 0)],
    ['Filtro de búsqueda aplicado', filtro],
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

  ws.getColumn(1).width = 42;
  ws.getColumn(2).width = 28;
}

/** Genera y descarga el informe XLSX con presentación profesional. */
export async function downloadCustomersExcel(
  rows: Customer[],
  searchLabel = '',
  generatedAt: Date = new Date(),
): Promise<void> {
  const { Workbook } = await import('exceljs');
  const workbook = new Workbook();
  workbook.creator = 'Cherry Ink · Rock City';
  workbook.created = generatedAt;
  workbook.modified = generatedAt;
  workbook.title = 'Informe de clientes';

  const wsClients = workbook.addWorksheet('Clientes', {
    properties: { defaultRowHeight: 18 },
    pageSetup: { orientation: 'landscape', fitToPage: true, fitToWidth: 1 },
  });
  buildClientsSheet(wsClients, rows, searchLabel, generatedAt);

  const wsSummary = workbook.addWorksheet('Resumen', {
    properties: { defaultRowHeight: 18 },
  });
  buildSummarySheet(wsSummary, rows, searchLabel, generatedAt);

  const filename = `Informe-clientes-${excelFilenameStamp(generatedAt)}.xlsx`;
  await downloadExcelWorkbook(() => workbook.xlsx.writeBuffer(), filename);
}
