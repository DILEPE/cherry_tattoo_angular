export type ContractKind = 'tattoo' | 'piercing' | 'recibo';

/** Flujo de firma configurado en la plantilla activa. */
export type ContractSigningFlow = 'phased' | 'single';

export const CONTRACT_SIGNING_FLOW_LABELS: Record<ContractSigningFlow, string> = {
  phased: 'Con fases (3 pasos)',
  single: 'Sin fases (una pantalla)',
};

export const CONTRACT_KIND_LABEL_ES: Record<ContractKind, string> = {
  tattoo: 'Tatuaje',
  piercing: 'Piercing',
  recibo: 'Recibo',
};

export const CONTRACT_KINDS: readonly ContractKind[] = ['tattoo', 'piercing', 'recibo'];

export const CONTRACT_PLACEHOLDERS_HINT =
  'Variables admitidas en el texto: {{nombres}}, {{identificacion}}, {{numero_documento}}, ' +
  '{{fecha_expedicion}}, {{nombre_tutor}}, {{identificacion_tutor}}, {{numero_documento_tutor}}, ' +
  '{{fecha_expedicion_tutor}}.';

export const RECEIPT_PLACEHOLDERS_HINT =
  'Este texto reemplaza las condiciones legales bajo la franja ATENCIÓN del PDF (no repite datos del cliente). ' +
  'Variables opcionales: {{nombres}}, {{servicio}}, {{abono}}, {{pendiente}}, {{cita_id}}, {{fecha_emision}}, etc.';

export const CONTRACT_PLACEHOLDER_CHIPS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Nombres', value: '{{nombres}}' },
  { label: 'Identificación', value: '{{identificacion}}' },
  { label: 'Nº documento', value: '{{numero_documento}}' },
  { label: 'Expedición doc.', value: '{{fecha_expedicion}}' },
  { label: 'Nombre tutor', value: '{{nombre_tutor}}' },
  { label: 'ID tutor', value: '{{identificacion_tutor}}' },
  { label: 'Doc. tutor', value: '{{numero_documento_tutor}}' },
  { label: 'Exp. tutor', value: '{{fecha_expedicion_tutor}}' },
];

export const RECEIPT_PLACEHOLDER_CHIPS: ReadonlyArray<{ label: string; value: string }> = [
  { label: 'Nombres', value: '{{nombres}}' },
  { label: 'Teléfono', value: '{{telefono}}' },
  { label: 'E-mail', value: '{{email}}' },
  { label: 'Fecha cita', value: '{{fecha_cita}}' },
  { label: 'Hora', value: '{{hora}}' },
  { label: 'Servicio', value: '{{servicio}}' },
  { label: 'Diseño', value: '{{diseno}}' },
  { label: 'Precio', value: '{{precio}}' },
  { label: 'Este abono', value: '{{abono}}' },
  { label: 'Total abonado', value: '{{total_abonado}}' },
  { label: 'Pendiente', value: '{{pendiente}}' },
  { label: 'Abono 1', value: '{{abono_1}}' },
  { label: 'Abono 2', value: '{{abono_2}}' },
  { label: 'Abono 3', value: '{{abono_3}}' },
  { label: 'Lista abonos', value: '{{abonos}}' },
  { label: 'Tipo recibo', value: '{{tipo_recibo}}' },
  { label: 'Cita #', value: '{{cita_id}}' },
  { label: 'Fecha emisión', value: '{{fecha_emision}}' },
];

export interface ContractTemplate {
  id: number;
  name: string;
  contractKind: ContractKind;
  version: string;
  content: string;
  isActive: boolean;
  signingFlow: ContractSigningFlow;
}

export interface ContractTemplateWritePayload {
  name: string;
  contract_kind: ContractKind;
  version: string;
  content: string;
  is_active: boolean;
  signing_flow: ContractSigningFlow;
}
