import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { SignedContractsApiService } from '../../services/signed-contracts-api.service';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { resolveContractModalData, resolveContractReadId } from '../contract-modal.util';
import { ErrorService } from '../../../../core/services/error.service';

function looksLikeHtml(s: string): boolean {
  return /<\/?[a-z][\s\S]*>/i.test(s);
}

@Component({
  selector: 'app-contract-read-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, AppSkeletonComponent],
  template: `
    <p class="appt-dialog-caption">
      Contrato #{{ contractId() }}
      @if (label()) {
        · {{ label() }}
      }
    </p>
    @if (loading()) {
      <app-skeleton [rows]="6" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
    } @else if (!hasText()) {
      <p class="empty-state">Este contrato no tiene texto guardado.</p>
    } @else if (isHtml()) {
      <div class="ct-read-shell ct-read-shell--html" [innerHTML]="safeHtml()"></div>
    } @else {
      <div class="ct-read-shell ct-read-shell--plain">{{ plainText() }}</div>
    }
    <div class="appt-dialog-actions">
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    </div>
  `,
})
export class ContractReadDialogComponent {
  private readonly api = inject(SignedContractsApiService);
  private readonly ui = inject(UiStore);
  private readonly errors = inject(ErrorService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rawText = signal('');
  readonly contractId = signal(resolveContractReadId(this.ui));
  readonly label = signal(resolveContractModalData(this.ui).contractLabel ?? '');

  readonly isHtml = computed(() => looksLikeHtml(this.rawText()));
  readonly plainText = computed(() => this.rawText());
  readonly hasText = computed(() => !!this.rawText().trim());
  readonly safeHtml = computed(() =>
    this.sanitizer.bypassSecurityTrustHtml(this.rawText()),
  );

  private readonly _load = effect(() => {
    const id = resolveContractReadId(this.ui);
    const modalId = this.ui.activeModal()?.id;
    if (id <= 0 || modalId !== 'contract-read') return;
    this.contractId.set(id);
    this.label.set(resolveContractModalData(this.ui).contractLabel ?? '');
    this.loading.set(true);
    this.api.getById(id).subscribe({
      next: (c) => {
        this.rawText.set((c.contractText ?? '').trim());
        this.error.set(null);
        this.loading.set(false);
      },
      error: (err) => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el contrato.');
        this.errors.handle(err);
      },
    });
  });

  close(): void {
    this.ui.closeModal();
  }
}
