export const ASSIGNABLE_PANEL_MODULES = [
  'citas',
  'clientes',
  'contratos',
  'encuestas',
  'reporte',
  'tiendas',
] as const;

export type PanelModuleKey = (typeof ASSIGNABLE_PANEL_MODULES)[number] | 'tiendas' | 'usuarios_panel';

export const PANEL_MODULE_LABELS: Record<string, string> = {
  citas: 'Gestión citas',
  clientes: 'Gestión de clientes',
  contratos: 'Gestión contratos',
  encuestas: 'Gestión encuesta',
  reporte: 'Gestión de reportes',
  tiendas: 'Gestión de tiendas',
  usuarios_panel: 'Gestión de usuarios',
};

export interface PanelUserPublic {
  id: number;
  username: string;
  role: string;
  session_expires_at?: number;
}

export interface PanelUserSession extends PanelUserPublic {
  effectiveModules?: PanelModuleKey[];
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
