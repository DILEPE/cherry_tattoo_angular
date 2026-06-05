import { ChangeDetectorRef, inject } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

export abstract class BaseForm<T> {
  abstract readonly form: FormGroup;

  protected readonly fb = inject(FormBuilder);
  protected readonly cd = inject(ChangeDetectorRef);

  abstract toModel(): T;

  reset(value?: Partial<T>): void {
    this.form.reset(value ?? {});
  }

  markAllTouched(): void {
    this.form.markAllTouched();
    this.cd.markForCheck();
  }
}
