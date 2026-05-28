# Angular Architecture Agent — Reglas del proyecto

> Aplica esta arquitectura en **todo** cambio dentro de `src/app/`. SCSS externo en `styles/`, componentes reutilizables en `shared/`, estado reactivo con Signals documentado en `store/`, renders `OnPush` obligatorio, sin estilos inline salvo geometría dinámica calculada en JS.

---

## Jerarquía de archivos obligatoria

Antes de crear o editar cualquier feature, verifica que esta estructura exista:

```
src/
├── app/
│   ├── core/
│   │   ├── interceptors/          # HTTP interceptors (auth, error, loading)
│   │   ├── guards/                # Route guards
│   │   ├── services/
│   │   │   ├── api.service.ts     # Cliente HTTP base (tipado, manejo de errores)
│   │   │   └── error.service.ts   # Centralización de errores globales
│   │   └── core.providers.ts      # provideCore() — inyectado en app.config.ts
│   │
│   ├── shared/
│   │   ├── ui/
│   │   │   ├── button/            # AppButtonComponent
│   │   │   ├── modal/             # AppModalComponent (@defer + signal-driven)
│   │   │   ├── toast/             # AppToastComponent + ToastService
│   │   │   ├── form-field/        # AppFormFieldComponent (label + error + input)
│   │   │   ├── pill/              # AppPillComponent (variantes via Input signal)
│   │   │   ├── badge/             # AppBadgeComponent
│   │   │   ├── data-table/        # AppDataTableComponent (virtualScroll-ready)
│   │   │   └── skeleton/          # AppSkeletonComponent (loading states)
│   │   ├── forms/
│   │   │   ├── base-form.ts       # clase base abstracta con validación reactiva
│   │   │   ├── form-validators.ts # validadores puros reutilizables
│   │   │   └── form-errors.pipe.ts # pipe para mensajes de error
│   │   ├── pipes/
│   │   │   ├── currency-cop.pipe.ts
│   │   │   ├── date-es.pipe.ts
│   │   │   └── truncate.pipe.ts
│   │   └── shared.providers.ts    # provideShared()
│   │
│   ├── store/                     # Estado global con Signals
│   │   ├── app.store.ts           # AppStore (signalStore de NGRX o manual)
│   │   ├── ui.store.ts            # UiStore: toasts, loading, modal activo
│   │   └── README.md              # Documenta claves, efectos y flujo de datos
│   │
│   ├── features/
│   │   └── [feature]/
│   │       ├── [feature].routes.ts          # Rutas lazy
│   │       ├── [feature].store.ts           # Estado local con Signals
│   │       ├── components/
│   │       │   ├── [feature]-shell/         # Orquestador — solo coordina
│   │       │   ├── [feature]-list/          # Lista paginada
│   │       │   └── [feature]-form/          # Formulario (usa shared/forms/)
│   │       ├── dialogs/
│   │       │   └── [feature]-dialog/        # Modales específicos del feature
│   │       ├── services/
│   │       │   └── [feature]-api.service.ts # Llamadas HTTP del feature
│   │       └── models/
│   │           ├── [feature].model.ts       # Interfaces y tipos
│   │           └── [feature].mapper.ts      # API response → modelo de dominio
│   │
│   ├── styles/
│   │   ├── _tokens.scss       # Variables de marca (colores, radios, sombras)
│   │   ├── _typography.scss   # Estilos de texto globales
│   │   ├── _utilities.scss    # Clases utilitarias (gap, padding, flex helpers)
│   │   ├── _animations.scss   # Keyframes reutilizables
│   │   └── _components.scss   # Clases de componentes compartidos (pills, badges)
│   │
│   ├── app.config.ts          # Providers raíz (router, http, stores)
│   └── app.routes.ts          # Rutas raíz (todas lazy)
│
└── styles.scss                # Solo @forward de _tokens y reset
```

---

## Regla 1 — Signals son la fuente de verdad del estado

### ❌ PROHIBIDO

```typescript
// Subjects de RxJS como estado de UI (propenso a memory leaks y difícil de componer)
private _items$ = new BehaviorSubject<Item[]>([]);
items$ = this._items$.asObservable();

// Mutaciones directas en el componente
this.items = await this.api.getItems(); // viola unidireccionalidad

// ngOnChanges para reaccionar a inputs
ngOnChanges(changes: SimpleChanges) {
  if (changes['userId']) { this.loadUser(); }
}
```

### ✅ CORRECTO

```typescript
// store/feature.store.ts — fuente de verdad con Signals
import { signalStore, withState, withComputed, withMethods } from '@ngrx/signals';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { tapResponse } from '@ngrx/operators';

export interface FeatureState {
  items: Item[];
  selectedId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: FeatureState = {
  items: [],
  selectedId: null,
  loading: false,
  error: null,
};

export const FeatureStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed(({ items, selectedId }) => ({
    selectedItem: computed(() => items().find(i => i.id === selectedId()) ?? null),
    totalCount:   computed(() => items().length),
    hasItems:     computed(() => items().length > 0),
  })),
  withMethods((store, api = inject(FeatureApiService)) => ({
    loadItems: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() => api.getAll().pipe(
          tapResponse({
            next: items => patchState(store, { items, loading: false }),
            error: (e: HttpErrorResponse) =>
              patchState(store, { error: e.message, loading: false }),
          })
        ))
      )
    ),
    selectItem(id: number) { patchState(store, { selectedId: id }); },
    invalidate()           { patchState(store, initialState); },
  }))
);
```

```typescript
// En el componente — inputs como signals, no ngOnChanges
@Component({ ... })
export class FeatureDetailComponent {
  readonly userId = input.required<number>();   // input signal
  private store = inject(FeatureStore);

  // Efecto declarativo: reacciona automáticamente al cambio de input
  private _loadEffect = effect(() => {
    this.store.loadItems(this.userId()); // se ejecuta cada vez que userId cambia
  });
}
```

### Contrato de Signals por capa

| Capa | Signal type | Uso |
|---|---|---|
| Store global | `signalStore` (NGRX) | Estado persistente entre rutas |
| Store de feature | `signalStore` local | Estado de la feature, se destruye con la ruta |
| Componente | `signal()` / `computed()` | Estado local UI (¿abierto el menú?, tab activo) |
| Input de componente | `input()` / `input.required()` | Props del padre |
| Output de componente | `output()` | Eventos hacia el padre |
| Formulario reactivo | `toSignal(form.valueChanges)` | Puente RxJS → Signal |

---

## Regla 2 — `ChangeDetectionStrategy.OnPush` es obligatorio

Todo componente **sin excepción** debe declarar `OnPush`. Angular con Signals + OnPush elimina prácticamente todos los ciclos de detección innecesarios.

```typescript
@Component({
  selector: 'app-item-list',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,  // SIEMPRE
  template: `
    @if (store.loading()) {
      <app-skeleton [rows]="5" />
    } @else if (store.hasItems()) {
      @for (item of store.items(); track item.id) {
        <app-item-card [item]="item" (selected)="store.selectItem($event)" />
      }
    } @else {
      <p class="empty-state">Sin resultados</p>
    }
  `,
})
export class ItemListComponent {
  readonly store = inject(FeatureStore);
}
```

### Reglas de renderizado

| Situación | Patrón correcto |
|---|---|
| Lista larga (>50 items) | `@for` + `trackBy` + `CdkVirtualScrollViewport` |
| Contenido cargado después | `@defer` con `@loading` y `@error` |
| Toggle de visibilidad | `@if` (no `[hidden]` ni `*ngIf` con wrapper) |
| Contenido alternativo | `@if ... @else` (no dos `@if` opuestos) |
| Switch de variantes | `@switch / @case` (no cadenas de `@if`) |

```html
<!-- ✅ Correcto: @defer para modales y contenido pesado -->
@defer (on interaction) {
  <app-feature-dialog [data]="selectedItem()" />
} @loading {
  <app-skeleton />
} @error {
  <p>Error al cargar</p>
}
```

---

## Regla 3 — Componentes de UI son puros y reutilizables

Cada componente en `shared/ui/` debe:
- Recibir **solo los datos que necesita** vía `input()` / `input.required()`
- Emitir eventos vía `output()` (nunca inyectar stores directamente)
- Usar `HostBinding` o `:host` en SCSS para estilos raíz
- Tener variantes controladas por input, no por clases CSS manuales
- No tener lógica de negocio (no llamadas HTTP, no store reads)

```typescript
// shared/ui/pill/app-pill.component.ts
export type PillVariant = 'success' | 'warning' | 'danger' | 'info' | 'neutral';

@Component({
  selector: 'app-pill',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class]': '"pill pill--" + variant()',
    '[attr.aria-label]': 'ariaLabel()',
  },
  template: `
    @if (icon()) { <i [class]="'icon icon--' + icon()" aria-hidden="true"></i> }
    <span>{{ label() }}</span>
  `,
  styles: [`
    :host { display: inline-flex; align-items: center; gap: 4px; }
  `]
})
export class AppPillComponent {
  readonly variant  = input<PillVariant>('neutral');
  readonly label    = input.required<string>();
  readonly icon     = input<string | null>(null);
  readonly ariaLabel = input<string | null>(null);
}
```

```html
<!-- Uso: sin clases manuales, sin estilos inline -->
<app-pill variant="success" label="Finalizada" icon="check" />
<app-pill variant="danger"  label="Cancelada" />
```

---

## Regla 4 — Formularios tienen clase base y validadores puros

### Clase base abstracta

```typescript
// shared/forms/base-form.ts
export abstract class BaseForm<T> {
  abstract readonly form: FormGroup;

  protected readonly fb = inject(FormBuilder);
  protected readonly cd = inject(ChangeDetectorRef);

  // Signal derivado del formulario reactivo
  readonly formValue = toSignal(
    this.form.valueChanges.pipe(startWith(this.form.value)),
    { initialValue: this.form.value }
  );
  readonly isValid   = computed(() => this.form.valid);
  readonly isDirty   = computed(() => this.form.dirty);

  abstract toModel(): T;

  reset(value?: Partial<T>): void {
    this.form.reset(value ?? {});
  }

  markAllTouched(): void {
    this.form.markAllAsTouched();
    this.cd.markForCheck();
  }
}
```

### Componente de formulario

```typescript
// features/appointments/components/appointment-form/appointment-form.component.ts
@Component({
  selector: 'app-appointment-form',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppFormFieldComponent, AppButtonComponent],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-form-field label="Cliente" [control]="form.controls.clientId">
        <input formControlName="clientId" type="text" />
      </app-form-field>

      <app-form-field label="Fecha" [control]="form.controls.date">
        <input formControlName="date" type="date" [min]="minDate()" />
      </app-form-field>

      <footer class="form-footer">
        <app-button variant="ghost" type="button" (clicked)="cancelled.emit()">
          Cancelar
        </app-button>
        <app-button variant="primary" type="submit" [loading]="saving()">
          {{ editMode() ? 'Guardar cambios' : 'Crear cita' }}
        </app-button>
      </footer>
    </form>
  `,
})
export class AppointmentFormComponent extends BaseForm<AppointmentDraft> {
  // Inputs
  readonly initialData = input<Partial<AppointmentDraft> | null>(null);
  readonly saving      = input<boolean>(false);
  readonly editMode    = input<boolean>(false);
  readonly minDate     = input<string>(today());

  // Outputs
  readonly submitted = output<AppointmentDraft>();
  readonly cancelled = output<void>();

  override readonly form = this.fb.group({
    clientId: ['', [Validators.required]],
    date:     ['', [Validators.required, futureDateValidator()]],
    slot:     ['', [Validators.required]],
    notes:    [''],
  });

  // Sincroniza initialData con el form cuando cambia
  private _patchEffect = effect(() => {
    const data = this.initialData();
    if (data) this.form.patchValue(data, { emitEvent: false });
  });

  onSubmit(): void {
    if (this.form.invalid) { this.markAllTouched(); return; }
    this.submitted.emit(this.toModel());
  }

  toModel(): AppointmentDraft {
    return this.form.getRawValue() as AppointmentDraft;
  }
}
```

### Validadores puros

```typescript
// shared/forms/form-validators.ts — sin dependencias de Angular DI

export function futureDateValidator(): ValidatorFn {
  return (control) => {
    if (!control.value) return null;
    const d = new Date(control.value);
    return d > new Date() ? null : { pastDate: { value: control.value } };
  };
}

export function phoneValidator(): ValidatorFn {
  return (control) => {
    const pattern = /^\+?[0-9]{7,15}$/;
    return !control.value || pattern.test(control.value)
      ? null
      : { invalidPhone: true };
  };
}

export function maxFileSizeValidator(maxMb: number): ValidatorFn {
  return (control) => {
    const file: File | null = control.value;
    if (!file) return null;
    return file.size <= maxMb * 1024 * 1024
      ? null
      : { maxFileSize: { maxMb, actualMb: (file.size / 1024 / 1024).toFixed(1) } };
  };
}
```

```typescript
// shared/forms/form-errors.pipe.ts
@Pipe({ name: 'formError', standalone: true, pure: false })
export class FormErrorPipe implements PipeTransform {
  transform(control: AbstractControl | null): string {
    if (!control?.errors || !control.touched) return '';
    const errors = control.errors;
    if (errors['required'])   return 'Este campo es obligatorio';
    if (errors['pastDate'])   return 'La fecha debe ser futura';
    if (errors['invalidPhone']) return 'Teléfono inválido';
    if (errors['maxFileSize']) return `Máximo ${errors['maxFileSize'].maxMb} MB`;
    if (errors['minlength'])  return `Mínimo ${errors['minlength'].requiredLength} caracteres`;
    return 'Campo inválido';
  }
}
```

---

## Regla 5 — Modales son signal-driven, sin props directas en template

Los modales **nunca** se abren pasando datos por binding en el template padre. El estado del modal vive en el `UiStore`.

```typescript
// store/ui.store.ts
export interface ModalState<T = unknown> {
  id: string;
  data: T;
}

export const UiStore = signalStore(
  { providedIn: 'root' },
  withState({
    activeModal:  null as ModalState | null,
    toasts:       [] as Toast[],
    globalLoading: false,
  }),
  withMethods((store) => ({
    openModal<T>(id: string, data: T): void {
      patchState(store, { activeModal: { id, data: data as unknown } });
    },
    closeModal(): void {
      patchState(store, { activeModal: null });
    },
    // Toast con auto-dismiss
    showToast(toast: Omit<Toast, 'id'>): void {
      const id = crypto.randomUUID();
      patchState(store, { toasts: [...store.toasts(), { ...toast, id }] });
      setTimeout(() => this.dismissToast(id), toast.duration ?? 4000);
    },
    dismissToast(id: string): void {
      patchState(store, { toasts: store.toasts().filter(t => t.id !== id) });
    },
  }))
);
```

```typescript
// shared/ui/modal/app-modal.component.ts
@Component({
  selector: 'app-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (isOpen()) {
      <div class="modal-backdrop" (click)="onBackdropClick($event)" role="dialog"
           [attr.aria-label]="title()" aria-modal="true">
        <div class="modal-container" [class]="'modal--' + size()">
          <header class="modal-header">
            <h2>{{ title() }}</h2>
            @if (dismissible()) {
              <button class="modal-close" (click)="ui.closeModal()" aria-label="Cerrar">
                <i class="icon icon--x"></i>
              </button>
            }
          </header>
          <div class="modal-body">
            <ng-content />
          </div>
        </div>
      </div>
    }
  `,
})
export class AppModalComponent {
  readonly title      = input.required<string>();
  readonly size       = input<'sm' | 'md' | 'lg'>('md');
  readonly dismissible = input<boolean>(true);
  readonly isOpen     = input<boolean>(false);
  readonly closed     = output<void>();

  protected readonly ui = inject(UiStore);

  onBackdropClick(e: MouseEvent): void {
    if (this.dismissible() && e.target === e.currentTarget) {
      this.ui.closeModal();
      this.closed.emit();
    }
  }
}
```

```typescript
// Patrón de uso: abrir modal desde un componente
@Component({ ... })
export class AppointmentListComponent {
  private ui    = inject(UiStore);
  private store = inject(AppointmentStore);

  openRescheduleModal(appt: Appointment): void {
    this.ui.openModal('reschedule', appt);  // ← siempre via store
  }
}

// En el shell — un solo lugar decide qué modal renderizar
@Component({
  template: `
    <appointment-list />

    @switch (ui.activeModal()?.id) {
      @case ('reschedule') {
        <app-modal title="Reprogramar cita" [isOpen]="true">
          <reschedule-form [data]="ui.activeModal()!.data" />
        </app-modal>
      }
      @case ('cancel') {
        <app-modal title="Cancelar cita" size="sm" [isOpen]="true">
          <cancel-confirm [data]="ui.activeModal()!.data" />
        </app-modal>
      }
    }
  `,
})
export class AppointmentShellComponent {
  protected readonly ui = inject(UiStore);
}
```

---

## Regla 6 — Toast es un servicio declarativo, no imperativo

```typescript
// shared/ui/toast/toast.service.ts
@Injectable({ providedIn: 'root' })
export class ToastService {
  private ui = inject(UiStore);

  success(message: string, duration = 4000): void {
    this.ui.showToast({ type: 'success', message, duration });
  }
  error(message: string, duration = 6000): void {
    this.ui.showToast({ type: 'error', message, duration });
  }
  info(message: string, duration = 4000): void {
    this.ui.showToast({ type: 'info', message, duration });
  }
  warn(message: string, duration = 5000): void {
    this.ui.showToast({ type: 'warning', message, duration });
  }
}
```

```typescript
// shared/ui/toast/app-toast-container.component.ts
@Component({
  selector: 'app-toast-container',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { class: 'toast-container', 'aria-live': 'polite', 'aria-atomic': 'false' },
  template: `
    @for (toast of ui.toasts(); track toast.id) {
      <div class="toast toast--{{ toast.type }}" role="status">
        <i class="icon icon--{{ iconMap[toast.type] }}" aria-hidden="true"></i>
        <span>{{ toast.message }}</span>
        <button class="toast-close" (click)="ui.dismissToast(toast.id)" aria-label="Cerrar">
          <i class="icon icon--x"></i>
        </button>
      </div>
    }
  `,
})
export class AppToastContainerComponent {
  protected readonly ui = inject(UiStore);
  protected readonly iconMap = {
    success: 'check-circle', error: 'alert-circle',
    info: 'info',            warning: 'alert-triangle',
  };
}
```

---

## Regla 7 — SCSS centralizado con tokens, sin estilos inline

### ❌ PROHIBIDO

```html
<!-- Estilos inline en templates -->
<div style="background: #ef4444; color: white; padding: 4px 8px; border-radius: 4px;">
  Cancelada
</div>

<!-- Clases de colores hardcoded dentro del componente -->
<span [ngClass]="{ 'bg-red-500 text-white': isError }">...</span>
```

### ✅ CORRECTO

```scss
// styles/_tokens.scss — fuente de verdad única
:root {
  // Marca
  --brand:          #d90064;
  --brand-light:    rgba(217, 0, 100, 0.08);
  --brand-border:   rgba(217, 0, 100, 0.3);

  // Radio
  --radius-sm:  4px;
  --radius-md:  8px;
  --radius-lg:  12px;
  --radius-pill: 999px;

  // Superficie
  --surface:        #ffffff;
  --surface-raised: #f8fafc;
  --border:         rgba(148, 163, 184, 0.22);
  --border-hover:   rgba(148, 163, 184, 0.45);
  --muted:          rgba(148, 163, 184, 0.6);

  // Semánticos
  --color-success-bg:     #e8f8ec;
  --color-success-text:   #1f6b31;
  --color-success-border: #b8e2c2;

  --color-warning-bg:     #fff2df;
  --color-warning-text:   #7a4a03;
  --color-warning-border: #f5d3a0;

  --color-danger-bg:      #fdeaea;
  --color-danger-text:    #7f1f1f;
  --color-danger-border:  #efbcbc;

  --color-info-bg:        #e8f1ff;
  --color-info-text:      #16406f;
  --color-info-border:    #bdd2f4;

  --color-neutral-bg:     #f2f3f5;
  --color-neutral-text:   #374151;
  --color-neutral-border: #d1d5db;
}

// styles/_components.scss — clases de componentes compartidos
.pill {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  border-radius: var(--radius-pill);
  padding: 0.18rem 0.62rem;
  font-size: 0.78rem;
  font-weight: 600;
  border: 1px solid transparent;

  &--success { background: var(--color-success-bg); color: var(--color-success-text); border-color: var(--color-success-border); }
  &--warning { background: var(--color-warning-bg); color: var(--color-warning-text); border-color: var(--color-warning-border); }
  &--danger  { background: var(--color-danger-bg);  color: var(--color-danger-text);  border-color: var(--color-danger-border);  }
  &--info    { background: var(--color-info-bg);    color: var(--color-info-text);    border-color: var(--color-info-border);    }
  &--neutral { background: var(--color-neutral-bg); color: var(--color-neutral-text); border-color: var(--color-neutral-border); }
}

.badge {
  display: inline-block;
  font-size: 10px;
  font-weight: 600;
  padding: 1px 6px;
  border-radius: var(--radius-sm);
  white-space: nowrap;

  &--tattoo   { background: #1e293b; color: #f1f5f9; }
  &--piercing { background: #EDE9FE; color: #5b21b6; }
  &--limpieza { background: #ECFEFF; color: #0e7490; }
}
```

**Excepción controlada:** `[style.top.px]`, `[style.height.px]`, `[style.left.px]` están permitidos **solo** cuando el valor es calculado dinámicamente en TypeScript (posición de un tooltip, altura de un calendario, offset de scroll). Color, borde y tipografía siempre en SCSS.

---

## Regla 8 — Mappers separan la API del dominio

```typescript
// features/appointments/models/appointment.mapper.ts

export interface AppointmentApiResponse {
  id: number;
  customer_name: string;
  scheduled_at: string;
  status: string;
  total_amount: string | number;
  deposit: string | number;
  pending_balance?: string | number | null;
}

export interface Appointment {
  id: number;
  customerName: string;
  scheduledAt: Date;
  status: AppointmentStatus;
  financials: AppointmentFinancials;
}

export interface AppointmentFinancials {
  total:   number;
  deposit: number;
  pending: number;
  // Formato COP listo para mostrar
  totalFmt:   string;
  depositFmt: string;
  pendingFmt: string;
}

export type AppointmentStatus = 'agendada' | 'reprogramada' | 'cancelada' | 'finalizada';

// ── Funciones puras — testeables sin Angular ─────────────────────────────────

export function mapAppointment(raw: AppointmentApiResponse): Appointment {
  const financials = mapFinancials(raw);
  return {
    id:           raw.id,
    customerName: raw.customer_name,
    scheduledAt:  new Date(raw.scheduled_at),
    status:       normalizeStatus(raw.status),
    financials,
  };
}

function mapFinancials(raw: AppointmentApiResponse): AppointmentFinancials {
  const deposit = toFloat(raw.deposit);
  const total   = Math.max(toFloat(raw.total_amount), deposit);
  const pending = raw.pending_balance != null && raw.pending_balance !== ''
    ? Math.max(toFloat(raw.pending_balance), 0)
    : Math.max(total - deposit, 0);

  return {
    total, deposit, pending,
    totalFmt:   formatCOP(total),
    depositFmt: formatCOP(deposit),
    pendingFmt: formatCOP(pending),
  };
}

function normalizeStatus(s: string): AppointmentStatus {
  const map: Record<string, AppointmentStatus> = {
    agendada: 'agendada', scheduled: 'agendada',
    reprogramada: 'reprogramada', rescheduled: 'reprogramada',
    cancelada: 'cancelada', cancelled: 'cancelada', canceled: 'cancelada',
    finalizada: 'finalizada', completed: 'finalizada',
  };
  return map[(s ?? '').toLowerCase()] ?? 'agendada';
}

function toFloat(v: unknown, def = 0): number {
  const n = parseFloat(String(v));
  return isNaN(n) ? def : n;
}

export function formatCOP(amount: number): string {
  return `COP $${Math.round(amount).toLocaleString('es-CO')}`;
}
```

---

## Regla 9 — Shells son orquestadores de ≤15 líneas de lógica

```typescript
// features/appointments/components/appointment-shell/appointment-shell.component.ts
@Component({
  selector: 'app-appointment-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppointmentListComponent, AppointmentFiltersComponent,
            AppModalComponent, RescheduleFormComponent, AppToastContainerComponent],
  template: `
    <app-appointment-filters (filtersChanged)="store.applyFilters($event)" />
    <app-appointment-list
      [items]="store.filteredItems()"
      [loading]="store.loading()"
      (reschedule)="openModal('reschedule', $event)"
      (cancel)="openModal('cancel', $event)"
    />

    @switch (ui.activeModal()?.id) {
      @case ('reschedule') {
        <app-modal title="Reprogramar cita" [isOpen]="true">
          <reschedule-form [appointment]="ui.activeModal()!.data"
                           (saved)="onRescheduled()" />
        </app-modal>
      }
    }
  `,
})
export class AppointmentShellComponent implements OnInit {
  protected readonly store = inject(AppointmentStore);
  protected readonly ui    = inject(UiStore);
  private readonly toast   = inject(ToastService);

  ngOnInit(): void { this.store.loadAll(); }

  openModal(id: string, data: unknown): void { this.ui.openModal(id, data); }

  onRescheduled(): void {
    this.ui.closeModal();
    this.store.invalidate();
    this.toast.success('Cita reprogramada correctamente');
  }
}
```

---

## Regla 10 — Performance: lazy, defer y virtualScroll

```typescript
// app.routes.ts — todas las features son lazy
export const routes: Routes = [
  {
    path: 'appointments',
    loadChildren: () =>
      import('./features/appointments/appointments.routes')
        .then(m => m.APPOINTMENT_ROUTES),
  },
];
```

```typescript
// Resolvers con Signals para precargar datos
export const appointmentResolver: ResolveFn<Appointment[]> = () => {
  const store = inject(AppointmentStore);
  store.loadAll();
  // Espera hasta que deje de cargar
  return toObservable(store.loading).pipe(
    filter(loading => !loading),
    take(1),
    map(() => store.items())
  );
};
```

```html
<!-- Lista larga: CDK Virtual Scroll -->
<cdk-virtual-scroll-viewport itemSize="72" class="appointment-viewport">
  @for (item of store.items(); track item.id) {
    <app-appointment-card [appointment]="item" />
  }
</cdk-virtual-scroll-viewport>

<!-- Imágenes y contenido pesado: @defer automático -->
@defer (on viewport) {
  <app-appointment-gallery [images]="item.photos" />
} @placeholder {
  <div class="img-placeholder"></div>
}
```

---

## Regla 11 — Pipes para transformaciones en template

Nunca transformes datos directamente en el template con funciones impuras. Usa pipes `pure: true` (default).

```typescript
// shared/pipes/currency-cop.pipe.ts
@Pipe({ name: 'currencyCop', standalone: true })
export class CurrencyCopPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return formatCOP(value);  // reutiliza la función del mapper
  }
}

// shared/pipes/date-es.pipe.ts
@Pipe({ name: 'dateEs', standalone: true })
export class DateEsPipe implements PipeTransform {
  private fmt = new Intl.DateTimeFormat('es-CO', {
    day: '2-digit', month: 'short', year: 'numeric'
  });
  transform(value: Date | string | null): string {
    if (!value) return '—';
    return this.fmt.format(new Date(value));
  }
}
```

```html
<!-- ✅ En el template -->
<td>{{ item.financials.total | currencyCop }}</td>
<td>{{ item.scheduledAt | dateEs }}</td>

<!-- ❌ Nunca esto — se ejecuta en cada ciclo de CD -->
<td>{{ formatCOP(item.financials.total) }}</td>
```

---

## Checklist antes de hacer PR

```
[ ] Todos los componentes tienen ChangeDetectionStrategy.OnPush
[ ] No hay estilos inline salvo coordenadas dinámicas ([style.top.px])
[ ] Tokens CSS definidos en _tokens.scss — sin hex hardcodeados en templates ni TS
[ ] Signals para todo estado: input(), output(), signal(), computed(), effect()
[ ] ngOnChanges no existe — reemplazado por effect() reactivo a input signals
[ ] Modales abiertos siempre vía UiStore.openModal(), no por binding directo
[ ] Toast siempre vía ToastService (success/error/info/warn)
[ ] Formularios extienden BaseForm<T> con validadores puros en form-validators.ts
[ ] Mappers convierten API → dominio antes de entrar al store
[ ] Cálculos financieros solo en mappers — nunca en templates ni components
[ ] Rutas lazy para todas las features
[ ] @defer para modales, galerías y contenido pesado
[ ] CdkVirtualScrollViewport para listas de más de 50 items
[ ] Pipes standalone para transformaciones en template (no funciones impuras)
[ ] Shell components tienen ≤ 15 líneas de lógica en la clase TypeScript
[ ] Cada @switch/@case de modales en el shell tiene su closeModal() correspondiente
[ ] Stores tienen método invalidate() que restaura initialState
[ ] toSignal() con initialValue para puentes RxJS → Signal
[ ] Todos los outputs son output() (no EventEmitter con @Output)
```

---

## Guía de migración incremental

Para migrar un módulo existente sin romper la app:

**Fase 1 — Signals de estado** (sin cambiar templates)
1. Reemplazar `BehaviorSubject` por `signal()` en servicios
2. Crear el store con `signalStore` para la feature
3. Migrar `ngOnChanges` a `effect()` reactivo

**Fase 2 — CSS y tokens**
4. Extraer todos los colores a `_tokens.scss`
5. Eliminar `style=` de los templates (excepto coordenadas dinámicas)
6. Crear clases BEM en `_components.scss` para los patrones repetidos

**Fase 3 — Componentes reutilizables**
7. Extraer pills, badges y flags a `shared/ui/`
8. Refactorizar inputs a `input()` y outputs a `output()`
9. Añadir `ChangeDetectionStrategy.OnPush` a todos los componentes

**Fase 4 — Formularios y validación**
10. Crear `BaseForm<T>` y migrar formularios existentes
11. Extraer validadores a `form-validators.ts`
12. Crear `FormErrorPipe` y usarla en los `app-form-field`

**Fase 5 — Modales y toasts**
13. Implementar `UiStore` con `activeModal` y `toasts`
14. Migrar todos los `*ngIf="showModal"` al patrón de `@switch` en el shell
15. Reemplazar `console.log` de feedback por `ToastService`

**Fase 6 — Performance**
16. Hacer todas las rutas lazy con `loadChildren`
17. Añadir `@defer` a modales y contenido below-the-fold
18. Añadir `CdkVirtualScrollViewport` a listas largas
