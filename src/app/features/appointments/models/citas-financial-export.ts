import { Appointment } from './appointment.model';
import { formatCop } from './appointment.mapper';
import { appointmentTimeHm } from './calendar.mapper';

function formatWhen(row: Appointment): string {
  const d = row.appointmentDate;
  const hm = appointmentTimeHm(row.appointmentDateRaw ?? d);
  if (!d) return row.appointmentDateRaw ?? '';
  const pad = (n: number) => String(n).padStart(2, '0');
  const date = `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  return hm !== '—' ? `${date} ${hm}` : date;
}

const HEADERS = [
  'Cliente',
  'Artista / profesional',
  'Servicio',
  'Tipo trabajo / detalle',
  'Fecha y hora',
  'Valor total (COP)',
  'Abonado (COP)',
  'Pendiente (COP)',
  'Estado',
];

function rowsToMatrix(items: Appointment[]): unknown[][] {
  const data: unknown[][] = [HEADERS];
  for (const r of items) {
    data.push([
      r.customerName,
      r.assignedLabel,
      r.serviceType,
      r.detail || '—',
      formatWhen(r),
      r.financials.total,
      r.financials.deposit,
      r.financials.pending,
      r.statusLabel,
    ]);
  }
  return data;
}

export function appointmentsToFinancialCsv(items: Appointment[]): string {
  const lines = rowsToMatrix(items).map((row) =>
    row.map((cell) => `"${String(cell ?? '').replace(/"/g, '""')}"`).join(','),
  );
  return lines.join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  triggerDownload(filename, blob);
}

/** Export XLSX del filtro actual (requiere `xlsx` en runtime). */
export async function downloadAppointmentsExcel(
  items: Appointment[],
  filename?: string,
): Promise<void> {
  const xlsx = await import('xlsx');
  const matrix = rowsToMatrix(items);
  const ws = xlsx.utils.aoa_to_sheet(matrix);
  const wb = xlsx.utils.book_new();
  xlsx.utils.book_append_sheet(wb, ws, 'Citas');
  const stamp =
    filename ??
    `Informe-finanzas-citas-${new Date().toISOString().slice(0, 16).replace('T', '-').replace(':', '')}.xlsx`;
  xlsx.writeFile(wb, stamp);
}

function triggerDownload(filename: string, blob: Blob): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
