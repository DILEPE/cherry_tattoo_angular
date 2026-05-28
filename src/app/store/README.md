# Stores del panel Angular

## AppStore (`app.store.ts`)

- **Sesión:** `user`, persistido en `sessionStorage` (`cherry_panel_session`).
- **Módulos:** `allowedModules` desde `GET /api/panel-users/{id}/modules/effective`.
- **Métodos:** `login`, `logout`, `initFromSession`, `canAccessModule`.

## UiStore (`ui.store.ts`)

- **Modal activo:** `activeModal: { id, data }` — patrón signal-driven (Regla 5).
- **Toasts:** cola con auto-dismiss; usar `ToastService` en componentes.

## AppointmentsStore (`features/appointments/appointments.store.ts`)

- Estado local por ruta (`providers` en shell de citas).
- `load` vía `rxMethod`; invalidar con `invalidate()` o cambio de `reloadToken`.
- Vista: `viewMode` (`calendar` | `list`), `calendarMonth`, `appointmentsByDay`, `clientHistoryCounts`.
