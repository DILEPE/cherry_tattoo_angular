import {
  ContractKind,
  ContractSigningFlow,
  ContractTemplate,
  ContractTemplateWritePayload,
} from './contract-template.model';

function toKind(v: unknown): ContractKind {
  return String(v ?? 'tattoo').trim() === 'piercing' ? 'piercing' : 'tattoo';
}

function toSigningFlow(v: unknown): ContractSigningFlow {
  return String(v ?? 'phased').trim().toLowerCase() === 'single' ? 'single' : 'phased';
}

export function mapContractTemplate(raw: Record<string, unknown>): ContractTemplate {
  return {
    id: Number(raw['id'] ?? 0),
    name: String(raw['name'] ?? ''),
    contractKind: toKind(raw['contract_kind']),
    version: String(raw['version'] ?? ''),
    content: String(raw['content'] ?? ''),
    isActive: Boolean(raw['is_active'] ?? true),
    signingFlow: toSigningFlow(raw['signing_flow']),
  };
}

export function templateToWritePayload(t: {
  name: string;
  contractKind: ContractKind;
  version: string;
  content: string;
  isActive: boolean;
  signingFlow: ContractSigningFlow;
}): ContractTemplateWritePayload {
  return {
    name: t.name.trim(),
    contract_kind: t.contractKind,
    version: t.version.trim(),
    content: t.content.trim(),
    is_active: t.isActive,
    signing_flow: t.signingFlow,
  };
}
