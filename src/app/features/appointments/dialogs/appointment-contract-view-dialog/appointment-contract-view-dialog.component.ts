import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { catchError, forkJoin, map, of, switchMap } from 'rxjs';
import { UiStore } from '../../../../store/ui.store';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { CustomersApiService } from '../../../customers/services/customers-api.service';
import { ContractSigningApiService } from '../../contract-signing/services/contract-signing-api.service';
import { mapContractDetail, ContractDetail } from '../../contract-signing/models/contract-detail.mapper';
import { signatureImageSrc } from '../../contract-signing/models/signature.util';
import { mapAppointment } from '../../models/appointment.mapper';
import { Customer } from '../../../customers/models/customer.model';
import { CustomerFormComponent } from '../../../customers/components/customer-form/customer-form.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { ErrorService } from '../../../../core/services/error.service';
import { resolveAppointmentModalId } from '../appointment-modal.util';
import { DateEsPipe } from '../../../../shared/pipes/date-es.pipe';

@Component({
  selector: 'app-appointment-contract-view-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
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
  private readonly sanitizer = inject(DomSanitizer);

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly customer = signal<Customer | null>(null);
  readonly contract = signal<ContractDetail | null>(null);

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
        });
      }),
      switchMap(({ contract, appt }) => {
        const mapped = mapAppointment(appt);
        const cid = mapped.customerId;
        if (!cid || cid <= 0) {
          return of({ contract, customer: null as Customer | null });
        }
        return this.customersApi.getById(cid).pipe(
          switchMap((c) => of({ contract, customer: c })),
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
      },
      error: () => {
        this.loading.set(false);
        this.error.set('No se pudo cargar el contrato.');
      },
    });
  }

  close(): void {
    this.ui.closeModal();
  }
}
