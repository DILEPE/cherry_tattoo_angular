import { ChangeDetectionStrategy, Component, effect, inject, viewChild } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { trimRequiredValidator } from '../../../../shared/forms/form-validators';
import { LOGIN_FIELD_LABELS } from '../../../../shared/forms/form-field-labels';
import { validateFormBeforeSubmit } from '../../../../shared/forms/form-submit.util';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { AppStore } from '../../../../store/app.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';
import { FormShowErrorsDirective } from '../../../../shared/forms/form-show-errors.directive';
import { isClientRole } from '../../../../core/utils/panel-roles';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    AppButtonComponent,
    AppFormFieldComponent,
    FormShowErrorsDirective,
  ],
  template: `
    <div class="login-page panel-fade-in">
      <img
        class="login-page__logo"
        src="/assets/rock-city-logo.png"
        alt="Rock City"
        width="72"
        height="72"
      />
      <div class="login-card" [class.login-card--busy]="appStore.authLoading()">
        @if (appStore.authLoading()) {
          <div class="login-card__overlay" aria-live="polite" aria-busy="true">
            <span class="login-card__spinner" aria-hidden="true"></span>
            <span class="login-card__loading-text">
              {{ isOt ? 'Validando código…' : 'Iniciando sesión…' }}
            </span>
          </div>
        }

        @if (isOt) {
          <h1>Firmar con OTP</h1>
          <p>Ingresa el código de 6 dígitos que te dio el vendedor.</p>
          <form
            #formErrors="appFormShowErrors"
            [formGroup]="otForm"
            appFormShowErrors
            (ngSubmit)="onSubmitOt()"
            novalidate
            [attr.aria-busy]="appStore.authLoading()"
          >
            <app-form-field label="Código OTP" [control]="otForm.controls.code" controlId="otpCode">
              <input
                id="otpCode"
                class="login-ot-code"
                type="text"
                inputmode="numeric"
                maxlength="6"
                autocomplete="one-time-code"
                formControlName="code"
              />
            </app-form-field>

            @if (appStore.authError()) {
              <p class="form-field__error">{{ appStore.authError() }}</p>
            }

            <app-button type="submit" variant="primary" [loading]="appStore.authLoading()">
              Continuar a firmar
            </app-button>
          </form>
          <a class="login-card__alt" routerLink="/login">Ingreso personal</a>
        } @else {
          <h1>Ingreso personal</h1>
          <p>Panel de operaciones</p>
          <form
            #formErrors="appFormShowErrors"
            [formGroup]="form"
            appFormShowErrors
            (ngSubmit)="onSubmit()"
            novalidate
            [attr.aria-busy]="appStore.authLoading()"
          >
            <app-form-field label="Usuario" [control]="form.controls.username" controlId="username">
              <input id="username" type="text" formControlName="username" autocomplete="username" />
            </app-form-field>

            <app-form-field
              label="Contraseña"
              [control]="form.controls.password"
              controlId="password"
            >
              <input
                id="password"
                type="password"
                formControlName="password"
                autocomplete="current-password"
              />
            </app-form-field>

            @if (appStore.authError()) {
              <p class="form-field__error">{{ appStore.authError() }}</p>
            }

            <app-button type="submit" variant="primary" [loading]="appStore.authLoading()">
              Iniciar sesión
            </app-button>
          </form>
          <a class="login-card__alt" routerLink="/firmar">Firmar con OTP</a>
        }
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly appStore = inject(AppStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);
  private readonly formErrors = viewChild<FormShowErrorsDirective>('formErrors');

  /** `true` en `/firmar`; `false` en `/login`. */
  protected readonly isOt = inject(ActivatedRoute).snapshot.data['entry'] === 'ot';

  readonly form = this.fb.nonNullable.group({
    username: ['', trimRequiredValidator()],
    password: ['', trimRequiredValidator()],
  });

  readonly otForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^\d{6}$/)]],
  });

  private readonly _redirectAfterLogin = effect(() => {
    if (this.appStore.isAuthenticated()) {
      if (isClientRole(this.appStore.user()?.role ?? '')) {
        void this.router.navigateByUrl('/cliente');
        return;
      }
      const mods = this.appStore.allowedModuleKeys();
      const target = mods.includes('citas') ? '/citas' : mods[0] ? `/${mods[0]}` : '/citas';
      void this.router.navigateByUrl(target);
    }
  });

  onSubmit(): void {
    if (
      !validateFormBeforeSubmit(this.form, {
        toast: this.toast,
        fieldLabels: LOGIN_FIELD_LABELS,
        onInvalid: () => this.formErrors()?.activate(),
      })
    ) {
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.appStore.login({ username, password });
  }

  onSubmitOt(): void {
    if (
      !validateFormBeforeSubmit(this.otForm, {
        toast: this.toast,
        fieldLabels: LOGIN_FIELD_LABELS,
        onInvalid: () => this.formErrors()?.activate(),
      })
    ) {
      return;
    }
    this.appStore.loginOt(this.otForm.getRawValue().code.trim());
  }
}
