import {
  AssignablePanelModuleKey,
  PanelRole,
  PanelUserCreatePayload,
  PanelUserFormValue,
  PanelUserRow,
  PanelUserUpdatePayload,
} from './panel-user.model';

function toRole(v: unknown): PanelRole {
  const s = String(v ?? 'vendedor').trim() as PanelRole;
  return (['administrador', 'vendedor', 'perforador', 'tatuador'] as const).includes(s)
    ? s
    : 'vendedor';
}

export function mapPanelUser(raw: Record<string, unknown>): PanelUserRow {
  return {
    id: Number(raw['id'] ?? 0),
    username: String(raw['username'] ?? ''),
    firstName: String(raw['first_name'] ?? ''),
    lastName: String(raw['last_name'] ?? ''),
    address: raw['address'] != null && String(raw['address']).trim() ? String(raw['address']) : null,
    phone: raw['phone'] != null && String(raw['phone']).trim() ? String(raw['phone']) : null,
    storeId: Number(raw['store_id'] ?? 0),
    storeName: raw['store_name'] != null ? String(raw['store_name']) : null,
    role: toRole(raw['role']),
    isActive: Boolean(raw['is_active'] ?? true),
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
    updatedAt: raw['updated_at'] != null ? String(raw['updated_at']) : null,
  };
}

export function parseModuleGrants(raw: unknown): AssignablePanelModuleKey[] {
  if (!Array.isArray(raw)) return [];
  const allowed = new Set([
    'citas',
    'clientes',
    'contratos',
    'encuestas',
    'reporte',
    'tiendas',
  ]);
  return raw
    .map((x) => String(x).trim())
    .filter((k): k is AssignablePanelModuleKey => allowed.has(k));
}

export function formToCreatePayload(v: PanelUserFormValue): PanelUserCreatePayload {
  const body: PanelUserCreatePayload = {
    username: v.username.trim().toLowerCase(),
    password: v.password,
    first_name: v.firstName.trim(),
    last_name: v.lastName.trim(),
    store_id: v.storeId,
    role: v.role,
    is_active: v.isActive,
  };
  const addr = v.address.trim();
  const phone = v.phone.trim();
  if (addr) body.address = addr;
  if (phone) body.phone = phone;
  return body;
}

export function formToUpdatePayload(
  v: PanelUserFormValue,
  opts: { includePassword: boolean },
): PanelUserUpdatePayload {
  const body: PanelUserUpdatePayload = {
    first_name: v.firstName.trim(),
    last_name: v.lastName.trim(),
    address: v.address.trim() || null,
    phone: v.phone.trim() || null,
    store_id: v.storeId,
    role: v.role,
    is_active: v.isActive,
  };
  if (opts.includePassword && v.password.trim()) {
    body.password = v.password;
  }
  return body;
}

export function userToFormValue(
  u: PanelUserRow,
  moduleKeys: AssignablePanelModuleKey[],
): PanelUserFormValue {
  return {
    firstName: u.firstName,
    lastName: u.lastName,
    username: u.username,
    password: '',
    address: u.address ?? '',
    phone: u.phone ?? '',
    storeId: u.storeId,
    role: u.role,
    isActive: u.isActive,
    moduleKeys: [...moduleKeys],
  };
}
