import type { Alignment, Borders, Fill, Font, Worksheet } from 'exceljs';

/** Paleta alineada al panel Cherry Ink. */
export const EXCEL_COLORS = {
  brand: 'FFD90064',
  brandDark: 'FFB80055',
  brandSoft: 'FFFDF2F8',
  ink: 'FF111827',
  inkMuted: 'FF4B5563',
  inkBody: 'FF374151',
  headerBg: 'FF1F2937',
  headerText: 'FFFFFFFF',
  tableHeadBg: 'FFE5E7EB',
  tableHeadText: 'FF111827',
  rowAlt: 'FFF8FAFC',
  rowBase: 'FFFFFFFF',
  border: 'FF9CA3AF',
  borderLight: 'FFE5E7EB',
  accentInfo: 'FFE8F1FF',
} as const;

export const EXCEL_FONT = 'Calibri';

export function excelThinBorder(color: string = EXCEL_COLORS.border): Partial<Borders> {
  const side = { style: 'thin' as const, color: { argb: color } };
  return { top: side, left: side, bottom: side, right: side };
}

export function excelTitleFont(size = 16): Partial<Font> {
  return {
    name: EXCEL_FONT,
    size,
    bold: true,
    color: { argb: EXCEL_COLORS.headerText },
  };
}

export function excelSubtitleFont(): Partial<Font> {
  return {
    name: EXCEL_FONT,
    size: 10,
    color: { argb: EXCEL_COLORS.inkMuted },
  };
}

export function excelHeaderFont(): Partial<Font> {
  return {
    name: EXCEL_FONT,
    size: 11,
    bold: true,
    color: { argb: EXCEL_COLORS.tableHeadText },
  };
}

export function excelBodyFont(): Partial<Font> {
  return {
    name: EXCEL_FONT,
    size: 10,
    color: { argb: EXCEL_COLORS.inkBody },
  };
}

export function excelSolidFill(argb: string): Fill {
  return { type: 'pattern', pattern: 'solid', fgColor: { argb } };
}

export function excelCenterAlign(wrap = false): Partial<Alignment> {
  return { horizontal: 'center', vertical: 'middle', wrapText: wrap };
}

export function excelLeftAlign(wrap = false): Partial<Alignment> {
  return { horizontal: 'left', vertical: 'middle', wrapText: wrap };
}

export function excelRightAlign(): Partial<Alignment> {
  return { horizontal: 'right', vertical: 'middle' };
}

/** Título de informe (fila 1) con franja de marca. */
export function applyReportTitleRow(
  ws: Worksheet,
  text: string,
  colCount: number,
  row = 1,
): void {
  ws.mergeCells(row, 1, row, colCount);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = excelTitleFont(15);
  cell.fill = excelSolidFill(EXCEL_COLORS.brand);
  cell.alignment = excelCenterAlign();
  cell.border = excelThinBorder(EXCEL_COLORS.brandDark);
  ws.getRow(row).height = 30;
}

/** Subtítulo (fecha / filtro). */
export function applyReportSubtitleRow(
  ws: Worksheet,
  text: string,
  colCount: number,
  row = 2,
): void {
  ws.mergeCells(row, 1, row, colCount);
  const cell = ws.getCell(row, 1);
  cell.value = text;
  cell.font = excelSubtitleFont();
  cell.fill = excelSolidFill(EXCEL_COLORS.brandSoft);
  cell.alignment = excelCenterAlign(true);
  cell.border = excelThinBorder(EXCEL_COLORS.borderLight);
  ws.getRow(row).height = 22;
}

export async function downloadExcelWorkbook(
  writeBuffer: () => Promise<ArrayBuffer>,
  filename: string,
): Promise<void> {
  const buffer = await writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
