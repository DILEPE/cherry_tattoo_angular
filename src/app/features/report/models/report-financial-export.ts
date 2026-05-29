import { Appointment } from '../../appointments/models/appointment.model';
import { formatCop } from '../../appointments/models/appointment.mapper';

function csvCell(v: string): string {
  const s = v.replace(/"/g, '""');
  return `"${s}"`;
}

function formatWhen(d: Date | null, raw: string | null): string {
  if (!d) return raw ?? '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Export CSV del listado financiero (sin dependencia xlsx). */
export function appointmentsToFinancialCsv(rows: Appointment[]): string {
  const headers = [
    'ID',
    'Cliente',
    'Artista',
    'Servicio',
    'Fecha',
    'Total',
    'Abonado',
    'Pendiente',
    'Estado',
  ];
  const lines = [headers.map(csvCell).join(',')];
  for (const r of rows) {
    lines.push(
      [
        String(r.id),
        r.customerName,
        r.assignedLabel,
        r.serviceType,
        formatWhen(r.appointmentDate, r.appointmentDateRaw),
        formatCop(r.financials.total),
        formatCop(r.financials.deposit),
        formatCop(r.financials.pending),
        r.statusLabel,
      ]
        .map(csvCell)
        .join(','),
    );
  }
  return lines.join('\n');
}

export function downloadCsv(filename: string, content: string): void {
  const blob = new Blob(['\ufeff' + content], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
