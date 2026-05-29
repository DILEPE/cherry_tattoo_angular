export const PANEL_ROLE_CHOICES = [
  'administrador',
  'vendedor',
  'perforador',
  'tatuador',
] as const;

export type PanelRole = (typeof PANEL_ROLE_CHOICES)[number];

export const PANEL_ROLE_LABEL_ES: Record<PanelRole, string> = {
  administrador: 'Administrador',
  vendedor: 'Vendedor',
  perforador: 'Perforador',
  tatuador: 'Tatuador',
};

export const ASSIGNABLE_PANEL_MODULE_KEYS = [
  'citas',
  'clientes',
  'contratos',
  'encuestas',
  'reporte',
  'tiendas',
] as const;

export type AssignablePanelModuleKey = (typeof ASSIGNABLE_PANEL_MODULE_KEYS)[number];

export const PANEL_MODULE_LABEL_ES: Record<AssignablePanelModuleKey, string> = {
  citas: 'Gestión citas',
  clientes: 'Gestión de clientes',
  contratos: 'Gestión contratos',
  encuestas: 'Gestión encuesta',
  reporte: 'Gestión de reportes',
  tiendas: 'Gestión de tiendas',
};

export interface PanelUserRow {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  address: string | null;
  phone: string | null;
  storeId: number;
  storeName: string | null;
  role: PanelRole;
  isActive: boolean;
  createdAt: string | null;
  updatedAt: string | null;
}

export interface PanelUserCreatePayload {
  username: string;
  password: string;
  first_name: string;
  last_name: string;
  address?: string | null;
  phone?: string | null;
  store_id: number;
  role: PanelRole;
  is_active: boolean;
}

export interface PanelUserUpdatePayload {
  first_name?: string;
  last_name?: string;
  address?: string | null;
  phone?: string | null;
  store_id?: number;
  role?: PanelRole;
  is_active?: boolean;
  password?: string;
}

export interface PanelUserFormValue {
  firstName: string;
  lastName: string;
  username: string;
  password: string;
  address: string;
  phone: string;
  storeId: number;
  role: PanelRole;
  isActive: boolean;
  moduleKeys: AssignablePanelModuleKey[];
}

export function panelUserDisplayName(u: Pick<PanelUserRow, 'firstName' | 'lastName' | 'username'>): string {
  const full = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
  return full || u.username || '—';
}

export function isAdminRole(role: string): boolean {
  return role === 'administrador';
}
