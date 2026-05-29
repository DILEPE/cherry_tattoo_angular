import {

  ChangeDetectionStrategy,

  ChangeDetectorRef,

  Component,

  computed,

  effect,

  inject,

  input,

  output,

  signal,

  viewChild,

} from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { toSignal } from '@angular/core/rxjs-interop';

import { startWith } from 'rxjs';

import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';

import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';

import {

  collectFormValidationIssues,

  FieldValidationIssue,

  validateFormBeforeSubmit,

} from '../../../../shared/forms/form-submit.util';

import { ToastService } from '../../../../shared/ui/toast/toast.service';

import { trimRequiredValidator } from '../../../../shared/forms/form-validators';

import {

  ASSIGNABLE_PANEL_MODULE_KEYS,

  PanelUserFormValue,

  PanelUserRow,

  PANEL_MODULE_LABEL_ES,

  PANEL_ROLE_CHOICES,

  PANEL_ROLE_LABEL_ES,

  PanelRole,

  isAdminRole,

} from '../../models/panel-user.model';

import { userToFormValue } from '../../models/panel-user.mapper';

import {

  panelModulesRequiredValidator,

  panelStoreRequiredValidator,

  panelUsernameValidator,

} from '../../models/panel-user.validators';

import { PanelUsersStore } from '../../panel-users.store';



@Component({

  selector: 'app-panel-user-form',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [ReactiveFormsModule, AppFormFieldComponent, FormShowErrorsDirective],

  template: `

    <aside class="pu-form-guide" aria-label="Guía para configurar el usuario">

      <h5 class="pu-form-guide__title">Cómo debe quedar configurado el usuario</h5>

      <ul class="pu-form-guide__list">

        <li>

          <strong>Usuario (login):</strong> obligatorio al crear; solo minúsculas, números, punto,

          guion o guion bajo (mín. 3 caracteres). No se puede cambiar después.

        </li>

        <li>

          <strong>Contraseña:</strong> obligatoria al crear (mín. 8 caracteres). Al editar, déjela

          vacía si no quieres cambiarla.

        </li>

        <li><strong>Tienda:</strong> obligatoria; debe existir al menos una tienda activa en el catálogo.</li>

        <li>

          <strong>Rol:</strong> el <em>administrador</em> accede a todo el panel; los demás roles

          dependen de los módulos marcados abajo.

        </li>

        <li>

          <strong>Módulos:</strong> si el rol no es administrador, marque al menos una pestaña

          (citas, clientes, contratos, encuestas, reportes o tiendas).

        </li>

        <li><strong>Activo:</strong> solo los usuarios activos pueden iniciar sesión.</li>

      </ul>

    </aside>



    @if (validationIssues().length) {

      <div class="pu-form-errors" role="alert">

        <p class="pu-form-errors__title">Faltan datos o hay campos incorrectos:</p>

        <ul class="pu-form-errors__list">

          @for (issue of validationIssues(); track issue.path) {

            <li><strong>{{ issue.label }}</strong> — {{ issue.message }}</li>

          }

        </ul>

      </div>

    }



    <form [formGroup]="form" appFormShowErrors (ngSubmit)="submit()" novalidate>

      <div class="pu-form-grid">

        <app-form-field label="Nombre" [control]="form.controls.firstName">

          <input formControlName="firstName" maxlength="100" autocomplete="given-name" />

        </app-form-field>

        <app-form-field label="Apellido" [control]="form.controls.lastName">

          <input formControlName="lastName" maxlength="100" autocomplete="family-name" />

        </app-form-field>

        <app-form-field

          [label]="editMode() ? 'Usuario (login)' : 'Usuario (login) *'"

          [control]="form.controls.username"

        >

          <input

            formControlName="username"

            maxlength="80"

            autocomplete="username"

            [readonly]="editMode()"

            placeholder="ej: maria.recepcion"

          />

          @if (!editMode()) {

            <p class="pu-field-hint">Minúsculas, números, punto, guion o guion bajo (mín. 3).</p>

          }

        </app-form-field>

        <app-form-field [label]="passwordLabel()" [control]="form.controls.password">

          <input

            formControlName="password"

            type="password"

            maxlength="72"

            autocomplete="new-password"

            [placeholder]="editMode() ? 'Dejar vacío para no cambiar' : 'Mínimo 8 caracteres'"

          />

        </app-form-field>

        <app-form-field label="Dirección" [control]="form.controls.address">

          <input formControlName="address" maxlength="500" autocomplete="street-address" />

        </app-form-field>

        <app-form-field label="Celular" [control]="form.controls.phone">

          <input formControlName="phone" maxlength="32" autocomplete="tel" />

        </app-form-field>

        <app-form-field label="Tienda *" [control]="form.controls.storeId">

          <select formControlName="storeId">

            @if (!storeOptions().length) {

              <option [value]="0" disabled>Sin tiendas activas</option>

            }

            @for (s of storeOptions(); track s.id) {

              <option [value]="s.id">{{ s.name }}</option>

            }

          </select>

          @if (!storeOptions().length) {

            <p class="pu-field-hint pu-field-hint--warn">

              Cree una tienda activa en Gestión de tiendas antes de registrar usuarios.

            </p>

          }

        </app-form-field>

        <app-form-field label="Rol *" [control]="form.controls.role">

          <select formControlName="role">

            @for (r of roles; track r) {

              <option [value]="r">{{ roleLabel(r) }}</option>

            }

          </select>

        </app-form-field>

      </div>



      <label class="pu-form-check">

        <input type="checkbox" formControlName="isActive" />

        Usuario activo (puede iniciar sesión)

      </label>



      @if (!isAdminSelected()) {

        <fieldset

          class="pu-form-modules"

          [class.pu-form-modules--error]="form.controls.moduleKeys.invalid && form.controls.moduleKeys.touched"

        >

          <legend>Módulos permitidos *</legend>

          <p class="pu-form-modules__hint">

            Marque al menos un módulo. Así define qué pestañas verá al entrar al panel.

          </p>

          <div class="pu-form-modules__grid">

            @for (m of moduleKeys; track m) {

              <label class="pu-form-modules__item">

                <input

                  type="checkbox"

                  [checked]="hasModule(m)"

                  (change)="toggleModule(m, $event)"

                />

                {{ moduleLabel(m) }}

              </label>

            }

          </div>

          @if (form.controls.moduleKeys.touched && form.controls.moduleKeys.hasError('modulesRequired')) {

            <p class="form-field__error" role="alert">

              Marque al menos un módulo permitido para este rol.

            </p>

          }

        </fieldset>

      } @else {

        <p class="pu-form-admin-note">

          Los administradores tienen acceso completo al panel (todas las pestañas, incluida gestión de

          usuarios y tiendas).

        </p>

      }



      <ng-content select="[actions]" />

    </form>

  `,

})

export class PanelUserFormComponent {

  readonly initial = input<PanelUserRow | null>(null);

  readonly initialModules = input<readonly string[]>([]);

  readonly editMode = input(false);

  readonly submitted = output<PanelUserFormValue>();



  protected readonly roles = PANEL_ROLE_CHOICES;

  protected readonly moduleKeys = ASSIGNABLE_PANEL_MODULE_KEYS;

  protected readonly roleLabel = (r: PanelRole) => PANEL_ROLE_LABEL_ES[r];

  protected readonly moduleLabel = (m: (typeof ASSIGNABLE_PANEL_MODULE_KEYS)[number]) =>

    PANEL_MODULE_LABEL_ES[m];



  private readonly fb = inject(FormBuilder);

  private readonly toast = inject(ToastService);

  private readonly cdr = inject(ChangeDetectorRef);

  private readonly usersStore = inject(PanelUsersStore);

  private readonly formShowErrors = viewChild(FormShowErrorsDirective);



  readonly validationIssues = signal<FieldValidationIssue[]>([]);



  readonly storeOptions = computed(() => this.usersStore.stores());



  readonly passwordLabel = computed(() =>

    this.editMode() ? 'Nueva contraseña (opcional)' : 'Contraseña *',

  );



  readonly form = this.fb.nonNullable.group({

    firstName: ['', Validators.maxLength(100)],

    lastName: ['', Validators.maxLength(100)],

    username: ['', [panelUsernameValidator()]],

    password: [''],

    address: ['', Validators.maxLength(500)],

    phone: ['', Validators.maxLength(32)],

    storeId: [0, [panelStoreRequiredValidator()]],

    role: ['vendedor' as PanelRole, Validators.required],

    isActive: [true],

    moduleKeys: [[] as PanelUserFormValue['moduleKeys']],

  });



  private readonly roleValue = toSignal(

    this.form.controls.role.valueChanges.pipe(startWith(this.form.controls.role.value)),

    { initialValue: this.form.controls.role.value },

  );



  readonly isAdminSelected = computed(() => isAdminRole(this.roleValue()));



  private readonly fieldLabels: Record<string, string> = {

    firstName: 'Nombre',

    lastName: 'Apellido',

    username: 'Usuario (login)',

    password: 'Contraseña',

    address: 'Dirección',

    phone: 'Celular',

    storeId: 'Tienda',

    role: 'Rol',

    moduleKeys: 'Módulos permitidos',

  };



  constructor() {

    this.form.controls.moduleKeys.setValidators(
      panelModulesRequiredValidator(() => this.isAdminSelected()),
    );

    effect(() => {

      if (this.editMode()) {

        this.form.controls.username.disable({ emitEvent: false });

        this.form.controls.password.clearValidators();

      } else {

        this.form.controls.username.enable({ emitEvent: false });

        this.form.controls.password.setValidators([

          trimRequiredValidator(),

          Validators.minLength(8),

          Validators.maxLength(72),

        ]);

      }

      this.form.controls.password.updateValueAndValidity({ emitEvent: false });

    });



    effect(() => {

      const admin = this.isAdminSelected();

      this.form.controls.moduleKeys.setValidators(

        panelModulesRequiredValidator(() => this.isAdminSelected()),

      );

      if (admin) {

        this.form.controls.moduleKeys.setErrors(null);

      }

      this.form.controls.moduleKeys.updateValueAndValidity({ emitEvent: false });

    });

  }



  private readonly _patch = effect(() => {

    const u = this.initial();

    const mods = this.initialModules();

    if (!u) {

      const stores = this.storeOptions();

      const defaultStore = stores[0]?.id ?? 0;

      this.form.reset({

        firstName: '',

        lastName: '',

        username: '',

        password: '',

        address: '',

        phone: '',

        storeId: defaultStore,

        role: 'vendedor',

        isActive: true,

        moduleKeys: [],

      });

      if (this.editMode()) this.form.controls.username.disable({ emitEvent: false });

      this.validationIssues.set([]);

      return;

    }

    this.form.patchValue(userToFormValue(u, [...mods] as PanelUserFormValue['moduleKeys']));

    this.form.controls.username.disable({ emitEvent: false });

    this.validationIssues.set([]);

    this.cdr.markForCheck();

  });



  hasModule(m: (typeof ASSIGNABLE_PANEL_MODULE_KEYS)[number]): boolean {

    return this.form.controls.moduleKeys.value.includes(m);

  }



  toggleModule(m: (typeof ASSIGNABLE_PANEL_MODULE_KEYS)[number], ev: Event): void {

    const checked = (ev.target as HTMLInputElement).checked;

    const cur = [...this.form.controls.moduleKeys.value];

    const next = checked ? [...cur, m] : cur.filter((x) => x !== m);

    this.form.controls.moduleKeys.setValue(next);

    this.form.controls.moduleKeys.markAsTouched();

    this.form.controls.moduleKeys.updateValueAndValidity();

    this.cdr.markForCheck();

  }



  submit(): void {

    this.validationIssues.set([]);



    if (this.editMode()) {

      const pwd = this.form.controls.password.value.trim();

      if (pwd && pwd.length < 8) {

        this.form.controls.password.setErrors({ minlength: { requiredLength: 8, actualLength: pwd.length } });

        this.form.controls.password.markAsTouched();

        this.formShowErrors()?.activate();

        this.validationIssues.set([

          { path: 'password', label: 'Contraseña', message: 'Mínimo 8 caracteres si la cambias.' },

        ]);

        this.toast.warn('Contraseña: mínimo 8 caracteres si la cambias.');

        this.cdr.markForCheck();

        return;

      }

    }



    if (!this.isAdminSelected()) {

      this.form.controls.moduleKeys.updateValueAndValidity();

    }



    if (

      !validateFormBeforeSubmit(this.form, {

        toast: this.toast,

        fieldLabels: this.fieldLabels,

        onInvalid: () => {

          this.formShowErrors()?.activate();

          this.validationIssues.set(collectFormValidationIssues(this.form, this.fieldLabels));

        },

      })

    ) {

      this.cdr.markForCheck();

      return;

    }



    const raw = this.form.getRawValue();

    this.formShowErrors()?.reset();

    this.validationIssues.set([]);

    this.submitted.emit({

      ...raw,

      username: raw.username.trim().toLowerCase(),

    });

  }

}


