import { ChangeDetectionStrategy, Component, effect, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AppStore } from '../../../../store/app.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppFormFieldComponent } from '../../../../shared/ui/form-field/app-form-field.component';

@Component({
  selector: 'app-login',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AppButtonComponent, AppFormFieldComponent],
  template: `
    <div class="login-page panel-fade-in">
      <div class="login-card">
        <h1>Cherry Ink · Rock City</h1>
        <p>Panel de operaciones</p>

        <form [formGroup]="form" (ngSubmit)="onSubmit()">
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
      </div>
    </div>
  `,
})
export class LoginComponent {
  protected readonly appStore = inject(AppStore);
  private readonly fb = inject(FormBuilder);
  private readonly router = inject(Router);

  readonly form = this.fb.nonNullable.group({
    username: ['', Validators.required],
    password: ['', Validators.required],
  });

  private readonly _redirectAfterLogin = effect(() => {
    if (this.appStore.isAuthenticated()) {
      const mods = this.appStore.allowedModuleKeys();
      const target = mods.includes('citas') ? '/citas' : mods[0] ? `/${mods[0]}` : '/citas';
      void this.router.navigateByUrl(target);
    }
  });

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { username, password } = this.form.getRawValue();
    this.appStore.login({ username, password });
  }
}
