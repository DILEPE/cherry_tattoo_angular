import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { UiStore } from '../../../../store/ui.store';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { CustomersApiService } from '../../../customers/services/customers-api.service';
import { ContractSigningApiService } from '../../contract-signing/services/contract-signing-api.service';
import { mapContractDetail, ContractDetail } from '../../contract-signing/models/contract-detail.mapper';
import { signatureImageSrc } from '../../contract-signing/models/signature.util';
import { appointmentToContractKind } from '../../contract-signing/models/contract-kind.util';
import {
  PIERCING_TYPE_OPTIONS,
  piercingTypeDisplayLabel,
  resolvePiercingTypeCanonical,
} from '../../models/piercing-type-catalog';
import { mapAppointment } from '../../models/appointment.mapper';
import { Customer } from '../../../customers/models/customer.model';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { resolveAppointmentModalId } from '../appointment-modal.util';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-appointment-contract-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    CustomerFormComponent,
    AppButtonComponent,
    AppSkeletonComponent,
    DateEsPipe,
  ],
  template: `
    @if (loading()) {
      <app-skeleton [rows]="10" />
    } @else if (error()) {
      <p class="form-field__error">{{ error() }}</p>
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    } @else if (contract()) {
      @let ct = contract()!;
      <p class="ctsig-view-meta">
        Contrato #{{ ct.id }} · Cita #{{ ct.appointmentId }}
        @if (ct.serviceType) {
          · {{ ct.serviceType }}
        }
        @if (ct.appointmentDate) {
          · {{ ct.appointmentDate | dateEs }}
        }
      </p>

      @if (showPiercingEditor()) {
        <h4 class="ctsig-view-section">Tipo de piercing</h4>
        <div class="ctsig-piercing-type-edit">
          <label class="ctsig-piercing-type">
            Tipo de piercing
            <select
              [ngModel]="piercingType()"
              (ngModelChange)="piercingType.set($event)"
              name="piercingTypeView"
            >
              <option value="">Selecciona…</option>
              @for (opt of piercingTypeOptions; track opt) {
                <option [value]="opt">{{ piercingTypeLabel(opt) }}</option>
              }
            </select>
          </label>
          <app-button
            [disabled]="
              savingPiercing() ||
              !piercingType().trim() ||
              piercingType() === savedPiercingType()
            "
            (clicked)="savePiercingType()"
          >
            {{ savingPiercing() ? 'Guardando…' : 'Guardar tipo' }}
          </app-button>
        </div>
      }

      @if (customer(); as c) {
        <h4 class="ctsig-view-section">Datos personales del cliente</h4>
        <app-customer-form [initial]="c" [readonly]="true" />
      }

      <h4 class="ctsig-view-section">Contenido del contrato firmado</h4>
      <div class="ctsig-contract-body" [innerHTML]="contractHtml()"></div>

      <h4 class="ctsig-view-section">Firmas registradas</h4>
      <div class="ctsig-view-sigs" [class.ctsig-view-sigs--pair]="!ct.isMinor">
        <div class="ctsig-view-sig">
          <span class="ctsig-view-sig__label">Cliente</span>
          @if (clientSigSrc()) {
            <img [src]="clientSigSrc()!" alt="Firma del cliente" class="ctsig-view-sig__img" />
          } @else {
            <p class="ctsig-view-sig__empty">Sin firma de cliente en imagen.</p>
          }
        </div>
        @if (ct.isMinor) {
          <div class="ctsig-view-sig">
            <span class="ctsig-view-sig__label">Tutor</span>
            @if (tutorSigSrc()) {
              <img [src]="tutorSigSrc()!" alt="Firma del tutor" class="ctsig-view-sig__img" />
            } @else {
              <p class="ctsig-view-sig__empty">Sin firma del tutor.</p>
            }
          </div>
        }
        <div class="ctsig-view-sig">
          <span class="ctsig-view-sig__label">Profesional</span>
          @if (artistSigSrc()) {
            <img [src]="artistSigSrc()!" alt="Firma del profesional" class="ctsig-view-sig__img" />
          } @else {
            <p class="ctsig-view-sig__empty">Sin firma del profesional.</p>
          }
        </div>
      </div>

      @if (ct.isMinor) {
        <h4 class="ctsig-view-section">Documento del tutor</h4>
        <div class="ctsig-view-docs">
          <div class="ctsig-view-sig">
            <span class="ctsig-view-sig__label">Anverso</span>
            @if (tutorFrontSrc()) {
              <img [src]="tutorFrontSrc()!" alt="Anverso documento tutor" class="ctsig-view-sig__img" />
            } @else {
              <p class="ctsig-view-sig__empty">Sin imagen.</p>
            }
          </div>
          <div class="ctsig-view-sig">
            <span class="ctsig-view-sig__label">Reverso</span>
            @if (tutorBackSrc()) {
              <img [src]="tutorBackSrc()!" alt="Reverso documento tutor" class="ctsig-view-sig__img" />
            } @else {
              <p class="ctsig-view-sig__empty">Sin imagen.</p>
            }
          </div>
        </div>

        <h4 class="ctsig-view-section">Documento del menor</h4>
        <div class="ctsig-view-docs">
          <div class="ctsig-view-sig">
            <span class="ctsig-view-sig__label">Anverso</span>
            @if (minorFrontSrc()) {
              <img [src]="minorFrontSrc()!" alt="Anverso documento menor" class="ctsig-view-sig__img" />
            } @else {
              <p class="ctsig-view-sig__empty">Sin imagen.</p>
            }
          </div>
          <div class="ctsig-view-sig">
            <span class="ctsig-view-sig__label">Reverso</span>
            @if (minorBackSrc()) {
              <img [src]="minorBackSrc()!" alt="Reverso documento menor" class="ctsig-view-sig__img" />
            } @else {
              <p class="ctsig-view-sig__empty">Sin imagen.</p>
            }
          </div>
        </div>
      }

      <div class="appt-dialog-actions">
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      </div>
    }
  `,
})
export class AppointmentContractViewDialogComponent {
  private readonly ui = inject(UiStore);
  private readonly apptApi = inject(AppointmentsApiService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly contractApi = inject(ContractSigningApiService);
  private readonly errors = inject(ErrorService);
  private readonly toast = inject(ToastService);
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly contract = signal<ContractDetail | null>(null);
  readonly isPiercing = signal(false);
  readonly piercingType = signal('');
  readonly savedPiercingType = signal('');
  readonly savingPiercing = signal(false);

  /** Visible si el contrato/cita no es tatuaje (usa el mismo serviceType del meta). */
  readonly showPiercingEditor = computed(() => {
    const svc = (this.contract()?.serviceType || '').trim().toLowerCase();
    if (svc) {
      return !(svc.includes('tatu') || svc === 'tattoo');
    }
    return this.isPiercing();
  });

  protected readonly piercingTypeOptions = PIERCING_TYPE_OPTIONS;
  protected readonly piercingTypeLabel = piercingTypeDisplayLabel;

  readonly contractHtml = computed((): SafeHtml => {
    const text = (this.contract()?.contractText ?? '').trim();
    if (!text) return '';
    return this.sanitizer.bypassSecurityTrustHtml(text);
  });

  readonly clientSigSrc = computed(() =>
    signatureImageSrc(this.contract()?.clientSignature),
  );
  readonly tutorSigSrc = computed(() =>
    signatureImageSrc(this.contract()?.tutorSignature),
  );
  readonly artistSigSrc = computed(() =>
    signatureImageSrc(this.contract()?.artistSignature),
  );
  readonly tutorFrontSrc = computed(() =>
    signatureImageSrc(this.contract()?.tutorDocumentFront),
  );
  readonly tutorBackSrc = computed(() =>
    signatureImageSrc(this.contract()?.tutorDocumentBack),
  );
  readonly minorFrontSrc = computed(() =>
    signatureImageSrc(this.contract()?.minorDocumentFront),
  );
  readonly minorBackSrc = computed(() =>
    signatureImageSrc(this.contract()?.minorDocumentBack),
  );

  private readonly _load = effect(() => {
    if (this.ui.activeModal()?.id !== 'appointment-contract-view') return;
    const id = resolveAppointmentModalId(this.ui);
    if (id <= 0) return;
    this.fetch(id);
  });

  private fetch(appointmentId: number): void {
    this.loading.set(true);
    this.error.set(null);
    this.contract.set(null);
    this.customer.set(null);
    this.isPiercing.set(false);
    this.piercingType.set('');
    this.savedPiercingType.set('');

    this.contractApi.latestSummary(appointmentId).pipe(
      switchMap((summary) => {
        const contractId = summary.contractId;
        if (contractId <= 0) {
          throw new Error('Contrato no válido.');
        }
        return forkJoin({
          contract: this.contractApi
            .getContract(contractId)
            .pipe(map((row) => mapContractDetail(row))),
          appt: this.apptApi.get(appointmentId),
          labels: this.apptApi.getWorkPerformedLabels([appointmentId]).pipe(
            catchError(() => of({} as Record<number, string>)),
          ),
        });
      }),
      switchMap(({ contract, appt, labels }) => {
        const mapped = mapAppointment(appt);
        // Usar serviceType del contrato/cita (como en el meta), no el detalle:
        // el detalle a veces contiene «tatu» y ocultaría el selector por error.
        const serviceType = (contract.serviceType || mapped.serviceType || '').trim();
        const piercing =
          appointmentToContractKind({
            ...mapped,
            serviceType: serviceType || mapped.serviceType,
            detail: '',
          }) === 'piercing';
        const fromLabel = resolvePiercingTypeCanonical(labels[appointmentId] ?? '');
        const fromDetail = resolvePiercingTypeCanonical(mapped.detail ?? '');
        const current = fromLabel ?? fromDetail ?? '';
        const cid = mapped.customerId;
        if (!cid || cid <= 0) {
          return of({
            contract,
            customer: null as Customer | null,
            piercing,
            piercingType: current,
          });
        }
        return this.customersApi.getById(cid).pipe(
          map((c) => ({
            contract,
            customer: c,
            piercing,
            piercingType: current,
          })),
        );
      }),
      catchError((err) => {
        this.errors.handle(err);
        const msg =
          err?.status === 404
            ? 'No hay contrato firmado para esta cita.'
            : 'No se pudo cargar el contrato.';
        this.error.set(msg);
        return of(null);
      }),
    ).subscribe({
      next: (pack) => {
        this.loading.set(false);
        if (!pack) return;
        this.contract.set(pack.contract);
        if (pack.customer) this.customer.set(pack.customer);
        this.isPiercing.set(pack.piercing);
        this.piercingType.set(pack.piercingType);
        this.savedPiercingType.set(pack.piercingType);
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el contrato.');
      },
    });
  }

  savePiercingType(): void {
    const appointmentId = this.contract()?.appointmentId ?? 0;
    const value = this.piercingType().trim();
    if (appointmentId <= 0 || !value) {
      this.toast.warn('Selecciona el tipo de piercing.');
      return;
    }
    if (value === this.savedPiercingType()) return;

    this.savingPiercing.set(true);
    this.contractApi.updatePiercingType(appointmentId, value).subscribe({
      next: (res) => {
        this.savingPiercing.set(false);
        const canonical =
          resolvePiercingTypeCanonical(res.piercing_type_canonical || res.piercing_type) ||
          value;
        this.piercingType.set(canonical);
        this.savedPiercingType.set(canonical);
        this.toast.success('Tipo de piercing actualizado.');
      },
      error: (err) => {
        this.savingPiercing.set(false);
        this.errors.handle(err);
        this.toast.error('No se pudo actualizar el tipo de piercing.');
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
