export type ContractKind = 'tattoo' | 'piercing';

/** Flujo de firma configurado en la plantilla activa. */
export type ContractSigningFlow = 'phased' | 'single';

export const CONTRACT_SIGNING_FLOW_LABELS: Record<ContractSigningFlow, string> = {
  phased: 'Con fases (3 pasos)',
  single: 'Sin fases (una pantalla)',
};

export const CONTRACT_KIND_LABEL_ES: Record<ContractKind, string> = {
  tattoo: 'Tatuaje',
  piercing: 'Piercing',
};

export const CONTRACT_PLACEHOLDERS_HINT =
  'Variables admitidas en el texto: {{nombres}}, {{identificacion}}, {{numero_documento}}, ' +
  '{{fecha_expedicion}}, {{nombre_tutor}}, {{identificacion_tutor}}, {{numero_documento_tutor}}, ' +
  '{{fecha_expedicion_tutor}}.';

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
