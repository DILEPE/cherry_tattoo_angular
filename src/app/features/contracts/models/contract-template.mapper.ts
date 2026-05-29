import { ContractKind, ContractTemplate, ContractTemplateWritePayload } from './contract-template.model';

function toKind(v: unknown): ContractKind {
  return String(v ?? 'tattoo').trim() === 'piercing' ? 'piercing' : 'tattoo';
}

export function mapContractTemplate(raw: Record<string, unknown>): ContractTemplate {
  return {
    id: Number(raw['id'] ?? 0),
    name: String(raw['name'] ?? ''),
    contractKind: toKind(raw['contract_kind']),
    version: String(raw['version'] ?? ''),
    content: String(raw['content'] ?? ''),
    isActive: Boolean(raw['is_active'] ?? true),
  };
}

export function templateToWritePayload(t: {
  name: string;
  contractKind: ContractKind;
  version: string;
  content: string;
  isActive: boolean;
}): ContractTemplateWritePayload {
  return {
    name: t.name.trim(),
    contract_kind: t.contractKind,
    version: t.version.trim(),
    content: t.content.trim(),
    is_active: t.isActive,
  };
}
