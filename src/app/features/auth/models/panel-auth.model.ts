export const ASSIGNABLE_PANEL_MODULES = [
  'citas',
  'clientes',
  'contratos',
  'encuestas',
  'reporte',
  'tiendas',
] as const;

export type PanelModuleKey =
  | (typeof ASSIGNABLE_PANEL_MODULES)[number]
  | 'tipos_piercing'
  | 'usuarios_panel';

export const PANEL_MODULE_LABELS: Record<string, string> = {
  citas: 'Gestión citas',
  clientes: 'Gestión de clientes',
  contratos: 'Gestión contratos',
  encuestas: 'Gestión encuesta',
  reporte: 'Gestión de reportes',
  tiendas: 'Gestión de tiendas',
  tipos_piercing: 'Tipos de piercing',
  usuarios_panel: 'Gestión de usuarios',
};

export interface PanelUserPublic {
  id: number;
  username: string;
  role: string;
  store_id?: number | null;
  store_name?: string | null;
  session_expires_at?: number;
  appointment_id?: number | null;
  customer_id?: number | null;
}

export interface PanelUserSession extends PanelUserPublic {
  effectiveModules?: PanelModuleKey[];
  storeId?: number;
  storeName?: string;
  appointmentId?: number;
  customerId?: number;
  /** Unix epoch en ms: se renueva con actividad; expira tras inactividad prolongada. */
  sessionExpiresAt: number;
}

export interface PanelLoginResponse {
  status: string;
  message: string;
  user: PanelUserPublic;
}

export interface PanelModulesResponse {
  modules?: string[];
  module_keys?: string[];
}
