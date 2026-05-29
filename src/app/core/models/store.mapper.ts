import { Store, StoreFormValue, StoreOption, StoreWritePayload } from './store.model';

export function mapStore(raw: Record<string, unknown>): Store {
  return {
    id: Number(raw['id'] ?? 0),
    name: String(raw['name'] ?? '').trim(),
    address:
      raw['address'] != null && String(raw['address']).trim()
        ? String(raw['address']).trim()
        : null,
    phone:
      raw['phone'] != null && String(raw['phone']).trim() ? String(raw['phone']).trim() : null,
    email:
      raw['email'] != null && String(raw['email']).trim() ? String(raw['email']).trim() : null,
    isActive: Boolean(raw['is_active'] ?? true),
    createdAt: raw['created_at'] != null ? String(raw['created_at']) : null,
    updatedAt: raw['updated_at'] != null ? String(raw['updated_at']) : null,
  };
}

export function mapStoreOption(raw: Record<string, unknown>): StoreOption {
  return {
    id: Number(raw['id'] ?? 0),
    name: String(raw['name'] ?? '').trim() || `#${raw['id']}`,
    isActive: Boolean(raw['is_active'] ?? true),
  };
}

export function storeContactLabel(store: Pick<Store, 'phone' | 'email'>): string {
  const tel = store.phone?.trim() || '';
  const em = store.email?.trim() || '';
  if (tel && em) return `${tel} · ${em}`;
  return tel || em || '—';
}

export function formToWritePayload(v: StoreFormValue): StoreWritePayload {
  return {
    name: v.name.trim(),
    address: v.address.trim() || null,
    phone: v.phone.trim() || null,
    email: v.email.trim() || null,
    is_active: v.isActive,
  };
}

export function storeToFormValue(store: Store): StoreFormValue {
  return {
    name: store.name,
    address: store.address ?? '',
    phone: store.phone ?? '',
    email: store.email ?? '',
    isActive: store.isActive,
  };
}
