import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { forkJoin } from 'rxjs';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { AppointmentsApiService } from '../../../services/appointments-api.service';
import { CustomersApiService } from '../../../../customers/services/customers-api.service';
import { TemplatesApiService } from '../../../../contracts/services/templates-api.service';
import {
  ContractSigningApiService,
  SurveySubmitPayload,
} from '../../services/contract-signing-api.service';
import { mapAppointment } from '../../../models/appointment.mapper';
import { Appointment, AppointmentPayment } from '../../../models/appointment.model';
import { Customer, CustomerWritePayload } from '../../../../customers/models/customer.model';
import { ContractTemplate } from '../../../../contracts/models/contract-template.model';
import { SurveyQuestion } from '../../../../surveys/models/survey-question.model';
import { CustomerFormComponent } from '../../../../customers/components/customer-form/customer-form.component';
import { ContractSigningSurveyStepComponent } from '../contract-signing-survey-step/contract-signing-survey-step.component';
import { AppSignaturePadComponent } from '../../../../../shared/ui/signature-pad/app-signature-pad.component';
import { AppButtonComponent } from '../../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../../shared/ui/skeleton/app-skeleton.component';
import { ToastService } from '../../../../../shared/ui/toast/toast.service';
import { ErrorService } from '../../../../../core/services/error.service';
import { AppointmentsStore } from '../../../appointments.store';
import { appointmentPaymentReadyForSignature } from '../../models/contract-payment.util';
import {
  CONTRACT_NO_REFUND_NOTICE,
  minorGuardianDeclarationHtml,
  renderContractHtml,
} from '../../models/contract-text.util';
import {
  isDocumentCaptureAcceptable,
  isSignatureAcceptable,
  readImageFileAsDataUrl,
} from '../../models/signature.util';
import { appointmentToContractKind } from '../../models/contract-kind.util';
import { FormsModule } from '@angular/forms';
import { DocumentType } from '../../../../customers/models/customer.model';

@Component({
  selector: 'app-contract-signing-page',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    FormsModule,
    CustomerFormComponent,
    ContractSigningSurveyStepComponent,
    AppSignaturePadComponent,
    AppButtonComponent,
    AppSkeletonComponent,
  ],
  template: `
    <div class="ctsig-page panel-fade-in">
      <header class="ctsig-page__header">
        <a routerLink="/citas" class="ctsig-page__back">← Volver a citas</a>
        <h1>Firma de contrato</h1>
        @if (appointment(); as a) {
          <p class="ctsig-page__meta">
            Cita #{{ a.id }} · {{ a.customerName }} · {{ a.serviceType }}
          </p>
        }
      </header>

      @if (loading()) {
        <app-skeleton [rows]="8" />
      } @else if (loadError()) {
        <p class="form-field__error">{{ loadError() }}</p>
        <app-button variant="ghost" routerLink="/citas">Volver a citas</app-button>
      } @else if (artistOnly()) {
        <section class="ctsig-step">
          <h2>Firma del profesional</h2>
          @if (paymentBlock()) {
            <p class="form-field__error">{{ paymentBlock() }}</p>
          } @else if (!summaryPendingArtist()) {
            <p class="ctsig-page__meta">Este contrato ya tiene la firma del profesional.</p>
          } @else {
            <app-signature-pad
              label="Firma del tatuador/perforador *"
              (valueChange)="artistSig.set($event)"
            />
            <div class="ctsig-step-actions">
              <app-button variant="ghost" routerLink="/citas">Cancelar</app-button>
              <app-button
                variant="primary"
                [loading]="saving()"
                (clicked)="saveArtistOnly()"
              >
                Guardar firma profesional
              </app-button>
            </div>
          }
        </section>
      } @else if (signingPhased()) {
        <nav class="ctsig-steps" aria-label="Progreso">
          <span [class.ctsig-steps__active]="step() === 1">1. Datos</span>
          <span [class.ctsig-steps__active]="step() === 2">2. Cuestionario</span>
          <span [class.ctsig-steps__active]="step() === 3">3. Firma</span>
        </nav>

        @if (paymentBlock() && step() >= 2) {
          <p class="form-field__error">{{ paymentBlock() }}</p>
        }

        @switch (step()) {
          @case (1) {
            <section class="ctsig-step">
              <h2>Etapa 1 — Datos del cliente</h2>
              @if (customer(); as c) {
                <app-customer-form [initial]="c" (submitted)="onCustomerSaved($event)">
                  <div actions class="ctsig-step-actions">
                    <app-button type="button" variant="ghost" routerLink="/citas">
                      Cancelar
                    </app-button>
                    <app-button type="submit" variant="primary" [loading]="saving()">
                      Guardar y continuar
                    </app-button>
                  </div>
                </app-customer-form>
              }
            </section>
          }
          @case (2) {
            <section class="ctsig-step">
              <h2>Etapa 2 — Cuestionario</h2>
              @if (!questions().length) {
                <app-button variant="primary" (clicked)="goToSignStep()">
                  Continuar a firma
                </app-button>
              } @else {
                <app-contract-signing-survey-step
                  [questions]="questions()"
                  [appointmentId]="appointmentId()"
                  [serviceType]="appointment()?.serviceType ?? ''"
                  [submitting]="saving()"
                  (back)="step.set(1)"
                  (submitted)="onSurveySubmitted($event)"
                />
              }
            </section>
          }
          @case (3) {
            <section class="ctsig-step">
              <h2>Etapa 3 — Firma del contrato</h2>
              @if (customer(); as c) {
                <h3 class="ctsig-subsection">Datos personales del cliente</h3>
                <app-customer-form [initial]="c" [readonly]="true" />
              }
              @if (template(); as tpl) {
                <div class="ctsig-contract-meta">
                  <span
                    ><strong>{{ tpl.name }}</strong> · v{{ tpl.version }} ·
                    {{ todayLabel() }}</span
                  >
                </div>
                <div class="ctsig-contract-body" [innerHTML]="contractPreviewHtml()"></div>
                <p class="ctsig-notice">{{ refundNotice }}</p>
              }

              @if (isMinor()) {
                <h3>Datos del tutor (menor de edad)</h3>
                <div class="ctsig-tutor-grid">
                  <label>
                    Nombre del tutor *
                    <input type="text" [(ngModel)]="tutorName" name="tutorName" />
                  </label>
                  <label>
                    Tipo documento tutor *
                    <select [(ngModel)]="tutorDocType" name="tutorDocType">
                      @for (t of docTypes; track t) {
                        <option [value]="t">{{ t }}</option>
                      }
                    </select>
                  </label>
                  <label>
                    Número documento tutor *
                    <input type="text" [(ngModel)]="tutorDocNumber" name="tutorDocNumber" />
                  </label>
                  <label>
                    Fecha expedición tutor *
                    <input type="date" [(ngModel)]="tutorDocIssue" name="tutorDocIssue" />
                  </label>
                </div>
                @if (customer() && appointment()) {
                  <div
                    class="ctsig-declaration-preview"
                    [innerHTML]="guardianPreviewHtml()"
                  ></div>
                }
              }

              <h3>Firmas</h3>
              <div class="ctsig-sig-grid" [class.ctsig-sig-grid--minor]="isMinor()">
                <app-signature-pad
                  label="Firma del cliente *"
                  (valueChange)="clientSig.set($event)"
                />
                @if (isMinor()) {
                  <app-signature-pad
                    label="Firma del tutor *"
                    (valueChange)="tutorSig.set($event)"
                  />
                }
                <app-signature-pad
                  label="Firma del profesional (opcional aquí)"
                  (valueChange)="artistSig.set($event)"
                />
              </div>

              @if (isMinor()) {
                <h3>Documento del tutor</h3>
                <div class="ctsig-doc-upload">
                  <label>
                    Foto anverso *
                    <input type="file" accept="image/*" (change)="onTutorFront($event)" />
                  </label>
                  <label>
                    Foto reverso *
                    <input type="file" accept="image/*" (change)="onTutorBack($event)" />
                  </label>
                </div>
              }

              <div class="ctsig-step-actions">
                <app-button variant="ghost" (clicked)="step.set(2)">← Cuestionario</app-button>
                <app-button variant="primary" [loading]="saving()" (clicked)="saveContract()">
                  Guardar contrato firmado
                </app-button>
              </div>
            </section>
          }
        }
      } @else {
        <section class="ctsig-step ctsig-step--single">
          <h2>Firma de contrato</h2>
          @if (paymentBlock()) {
            <p class="form-field__error">{{ paymentBlock() }}</p>
          }
          @if (customer(); as c) {
            <h3 class="ctsig-subsection">Datos personales del cliente</h3>
            <app-customer-form #customerForm [initial]="c" />
            @if (questions().length) {
              <h3 class="ctsig-subsection">Cuestionario</h3>
              <app-contract-signing-survey-step
                #surveyStep
                [inline]="true"
                [questions]="questions()"
                [appointmentId]="appointmentId()"
                [serviceType]="appointment()?.serviceType ?? ''"
              />
            }
            <h3 class="ctsig-subsection">Contrato y firmas</h3>
            @if (template(); as tpl) {
              <div class="ctsig-contract-meta">
                <span
                  ><strong>{{ tpl.name }}</strong> · v{{ tpl.version }} ·
                  {{ todayLabel() }}</span
                >
              </div>
              <div class="ctsig-contract-body" [innerHTML]="contractPreviewHtml()"></div>
              <p class="ctsig-notice">{{ refundNotice }}</p>
            }
            @if (showTutorSection()) {
              <h3 class="ctsig-subsection">Datos del tutor (menor de edad)</h3>
              <div class="ctsig-tutor-grid">
                <label>
                  Nombre del tutor *
                  <input type="text" [(ngModel)]="tutorName" name="tutorNameSingle" />
                </label>
                <label>
                  Tipo documento tutor *
                  <select [(ngModel)]="tutorDocType" name="tutorDocTypeSingle">
                    @for (t of docTypes; track t) {
                      <option [value]="t">{{ t }}</option>
                    }
                  </select>
                </label>
                <label>
                  Número documento tutor *
                  <input type="text" [(ngModel)]="tutorDocNumber" name="tutorDocNumberSingle" />
                </label>
                <label>
                  Fecha expedición tutor *
                  <input type="date" [(ngModel)]="tutorDocIssue" name="tutorDocIssueSingle" />
                </label>
              </div>
              @if (customer() && appointment()) {
                <div
                  class="ctsig-declaration-preview"
                  [innerHTML]="guardianPreviewHtml()"
                ></div>
              }
            }
            <h3 class="ctsig-subsection">Firmas</h3>
            <div class="ctsig-sig-grid" [class.ctsig-sig-grid--minor]="showTutorSection()">
              <app-signature-pad
                label="Firma del cliente *"
                (valueChange)="clientSig.set($event)"
              />
              @if (showTutorSection()) {
                <app-signature-pad
                  label="Firma del tutor *"
                  (valueChange)="tutorSig.set($event)"
                />
              }
              <app-signature-pad
                label="Firma del profesional (opcional aquí)"
                (valueChange)="artistSig.set($event)"
              />
            </div>
            @if (showTutorSection()) {
              <h3 class="ctsig-subsection">Documento del tutor</h3>
              <div class="ctsig-doc-upload">
                <label>
                  Foto anverso *
                  <input type="file" accept="image/*" (change)="onTutorFront($event)" />
                </label>
                <label>
                  Foto reverso *
                  <input type="file" accept="image/*" (change)="onTutorBack($event)" />
                </label>
              </div>
            }
            <div class="ctsig-step-actions">
              <app-button variant="ghost" routerLink="/citas">Cancelar</app-button>
              <app-button variant="primary" [loading]="saving()" (clicked)="submitSingleFlow()">
                Guardar contrato firmado
              </app-button>
            </div>
          }
        </section>
      }
    </div>
  `,
})
export class ContractSigningPageComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly apptApi = inject(AppointmentsApiService);
  private readonly customersApi = inject(CustomersApiService);
  private readonly templatesApi = inject(TemplatesApiService);
  private readonly signingApi = inject(ContractSigningApiService);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly toast = inject(ToastService);
  private readonly errors = inject(ErrorService);
  private readonly sanitizer = inject(DomSanitizer);
  readonly customerFormRef = viewChild<CustomerFormComponent>('customerForm');
  readonly surveyStepRef = viewChild<ContractSigningSurveyStepComponent>('surveyStep');

  protected readonly refundNotice = CONTRACT_NO_REFUND_NOTICE;
  protected readonly docTypes: DocumentType[] = ['CC', 'TI', 'CE', 'PAS'];

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly loadError = signal<string | null>(null);
  readonly step = signal(1);
  readonly artistOnly = signal(false);
  readonly appointment = signal<Appointment | null>(null);
  readonly payments = signal<AppointmentPayment[]>([]);
  readonly customer = signal<Customer | null>(null);
  readonly template = signal<ContractTemplate | null>(null);
  readonly questions = signal<SurveyQuestion[]>([]);
  readonly summaryPendingArtist = signal(true);

  readonly clientSig = signal<string | null>(null);
  readonly tutorSig = signal<string | null>(null);
  readonly artistSig = signal<string | null>(null);
  readonly tutorDocFront = signal<string | null>(null);
  readonly tutorDocBack = signal<string | null>(null);

  tutorName = '';
  tutorDocType: DocumentType = 'CC';
  tutorDocNumber = '';
  tutorDocIssue = '';

  readonly appointmentId = computed(() => this.appointment()?.id ?? 0);

  readonly paymentBlock = computed(() => {
    const a = this.appointment();
    if (!a) return null;
    const { ok, message } = appointmentPaymentReadyForSignature(a, this.payments());
    return ok ? null : message;
  });

  readonly isMinor = computed(() => {
    const c = this.customer();
    return !!c?.isMinor;
  });

  /** Según la plantilla activa de la cita (persistido en BD). */
  readonly signingPhased = computed(() => this.template()?.signingFlow !== 'single');

  readonly contractPreviewHtml = computed((): SafeHtml => {
    const tpl = this.template();
    const c = this.customer();
    if (!tpl || !c) return '';
    const html = renderContractHtml(tpl.content, c);
    return this.sanitizer.bypassSecurityTrustHtml(html);
  });

  readonly guardianPreviewHtml = computed((): SafeHtml => {
    const c = this.customer();
    const a = this.appointment();
    if (!c || !a) return '';
    return this.sanitizer.bypassSecurityTrustHtml(
      minorGuardianDeclarationHtml(c, a, this.tutorName),
    );
  });

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('appointmentId'));
    const artistOnly =
      this.route.snapshot.queryParamMap.get('artistOnly') === '1' ||
      this.route.snapshot.queryParamMap.get('artistOnly') === 'true';
    this.artistOnly.set(artistOnly);

    if (id <= 0) {
      this.loadError.set('Cita no válida.');
      this.loading.set(false);
      return;
    }

    if (artistOnly) {
      this.loadArtistOnly(id);
      return;
    }
    this.loadFullFlow(id);
  }

  todayLabel(): string {
    return new Date().toLocaleDateString('es-CO');
  }

  showTutorSection(): boolean {
    const formRef = this.customerFormRef();
    if (formRef) return formRef.isMinorFromForm();
    return this.isMinor();
  }

  submitSingleFlow(): void {
    const c = this.customer();
    const a = this.appointment();
    if (!c || !a) return;

    const payload = this.customerFormRef()?.tryGetWritePayload();
    if (!payload) return;
    if (!payload.document_issue_date) {
      this.toast.warn(
        'Para firmar debes registrar la fecha de expedición del documento del cliente.',
      );
      return;
    }
    const pay = appointmentPaymentReadyForSignature(a, this.payments());
    if (!pay.ok) {
      this.toast.warn(pay.message ?? 'Completa el abono antes de continuar.');
      return;
    }

    const qs = this.questions();
    let surveyPayload: SurveySubmitPayload | null = null;
    if (qs.length) {
      surveyPayload = this.surveyStepRef()?.tryBuildPayload() ?? null;
      if (!surveyPayload) return;
    }

    this.saving.set(true);
    this.customersApi.update(c.id, payload).subscribe({
      next: () => {
        this.customersApi.getById(c.id).subscribe({
          next: (fresh) => {
            if (fresh) this.customer.set(fresh);
            const afterSurvey = () => {
              this.apptApi.get(a.id).subscribe({
                next: (row) => {
                  this.appointment.set(mapAppointment(row));
                  this.saving.set(false);
                  this.saveContract();
                },
                error: (err) => {
                  this.saving.set(false);
                  this.errors.handle(err);
                },
              });
            };
            if (surveyPayload) {
              this.signingApi.submitSurvey(surveyPayload).subscribe({
                next: () => afterSurvey(),
                error: (err) => {
                  this.saving.set(false);
                  this.errors.handle(err);
                },
              });
            } else {
              afterSurvey();
            }
          },
          error: (err) => {
            this.saving.set(false);
            this.errors.handle(err);
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  private loadArtistOnly(apptId: number): void {
    forkJoin({
      row: this.apptApi.get(apptId),
      payments: this.apptApi.getPayments(apptId),
    }).subscribe({
      next: ({ row, payments }) => {
        const appt = mapAppointment(row);
        this.appointment.set(appt);
        this.payments.set(payments);
        this.signingApi.latestSummary(apptId).subscribe({
          next: (s) => {
            this.summaryPendingArtist.set(s.pendingArtistSignature);
            this.loading.set(false);
          },
          error: (err) => {
            this.loadError.set('No se pudo verificar el contrato.');
            this.errors.handle(err);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.loadError.set('No se pudo cargar la cita.');
        this.errors.handle(err);
        this.loading.set(false);
      },
    });
  }

  private loadFullFlow(apptId: number): void {
    forkJoin({
      row: this.apptApi.get(apptId),
      payments: this.apptApi.getPayments(apptId),
    }).subscribe({
      next: ({ row, payments }) => {
        const appt = mapAppointment(row);
        this.appointment.set(appt);
        this.payments.set(payments);
        const cid = appt.customerId;
        if (!cid || cid <= 0) {
          this.loadError.set('La cita no tiene cliente asociado.');
          this.loading.set(false);
          return;
        }
        const kind = appointmentToContractKind(appt);
        forkJoin({
          customer: this.customersApi.getById(cid),
          questions: this.signingApi.listActiveSurveyQuestions(kind),
          templates: this.templatesApi.list({ onlyActive: true, contractKind: kind }),
        }).subscribe({
          next: ({ customer, questions, templates }) => {
            if (!customer) {
              this.loadError.set('Cliente no encontrado.');
              this.loading.set(false);
              return;
            }
            this.customer.set(customer);
            this.questions.set(questions);
            if (!templates.length) {
              this.loadError.set(
                `No hay plantilla activa para ${kind === 'tattoo' ? 'tatuaje' : 'piercing'}.`,
              );
              this.loading.set(false);
              return;
            }
            const tpl = templates[0];
            this.templatesApi.getById(tpl.id).subscribe({
              next: (full) => {
                this.template.set(full);
                this.tutorName = customer.guardianName ?? '';
                this.tutorDocType = customer.guardianDocumentType ?? 'CC';
                this.tutorDocNumber = customer.guardianDocumentNumber ?? '';
                this.tutorDocIssue = customer.guardianDocumentIssueDate ?? '';
                this.loading.set(false);
              },
              error: (err) => {
                this.loadError.set('No se pudo cargar la plantilla.');
                this.errors.handle(err);
                this.loading.set(false);
              },
            });
          },
          error: (err) => {
            this.loadError.set('Error al cargar datos de firma.');
            this.errors.handle(err);
            this.loading.set(false);
          },
        });
      },
      error: (err) => {
        this.loadError.set('No se pudo cargar la cita.');
        this.errors.handle(err);
        this.loading.set(false);
      },
    });
  }

  onCustomerSaved(payload: CustomerWritePayload): void {
    const c = this.customer();
    const a = this.appointment();
    if (!c || !a) return;
    if (!payload.document_issue_date) {
      this.toast.warn(
        'Para firmar debes registrar la fecha de expedición del documento del cliente.',
      );
      return;
    }
    const pay = appointmentPaymentReadyForSignature(a, this.payments());
    if (!pay.ok) {
      this.toast.warn(pay.message ?? 'Completa el abono antes de continuar.');
      return;
    }
    this.saving.set(true);
    this.customersApi.update(c.id, payload).subscribe({
      next: () => {
        this.customersApi.getById(c.id).subscribe({
          next: (fresh) => {
            this.saving.set(false);
            if (fresh) this.customer.set(fresh);
            this.toast.success('Datos del cliente guardados.');
            this.step.set(2);
          },
          error: () => {
            this.saving.set(false);
            this.step.set(2);
          },
        });
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  onSurveySubmitted(payload: SurveySubmitPayload): void {
    this.saving.set(true);
    this.signingApi.submitSurvey(payload).subscribe({
      next: () => {
        this.saving.set(false);
        this.toast.success('Cuestionario guardado.');
        this.goToSignStep();
      },
      error: (err) => {
        this.saving.set(false);
        this.errors.handle(err);
      },
    });
  }

  goToSignStep(): void {
    const a = this.appointment();
    if (!a) return;
    this.apptApi.get(a.id).subscribe({
      next: (row) => {
        const fresh = mapAppointment(row);
        this.appointment.set(fresh);
        this.apptApi.getPayments(a.id).subscribe({
          next: (pays) => {
            this.payments.set(pays);
            const pay = appointmentPaymentReadyForSignature(fresh, pays);
            if (!pay.ok) {
              this.toast.warn(pay.message ?? 'Completa el abono en Montos.');
              return;
            }
            this.step.set(3);
          },
          error: (err) => this.errors.handle(err),
        });
      },
      error: (err) => this.errors.handle(err),
    });
  }

  onTutorFront(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void readImageFileAsDataUrl(file).then((url) => this.tutorDocFront.set(url));
  }

  onTutorBack(ev: Event): void {
    const file = (ev.target as HTMLInputElement).files?.[0];
    if (!file) return;
    void readImageFileAsDataUrl(file).then((url) => this.tutorDocBack.set(url));
  }

  saveContract(): void {
    const a = this.appointment();
    const c = this.customer();
    const tpl = this.template();
    if (!a || !c || !tpl) return;

    const pay = appointmentPaymentReadyForSignature(a, this.payments());
    if (!pay.ok) {
      this.toast.warn(pay.message ?? 'Saldo pendiente.');
      return;
    }

    const minor = this.showTutorSection();
    const client = this.clientSig();
    if (!isSignatureAcceptable(client)) {
      this.toast.warn('Dibuja la firma del cliente.');
      return;
    }
    let tutorSig: string | null = null;
    if (minor) {
      tutorSig = this.tutorSig();
      if (!isSignatureAcceptable(tutorSig)) {
        this.toast.warn('Dibuja la firma del tutor.');
        return;
      }
      if (!isDocumentCaptureAcceptable(this.tutorDocFront())) {
        this.toast.warn('Adjunta foto anverso del documento del tutor.');
        return;
      }
      if (!isDocumentCaptureAcceptable(this.tutorDocBack())) {
        this.toast.warn('Adjunta foto reverso del documento del tutor.');
        return;
      }
      if (this.tutorName.trim().length < 3) {
        this.toast.warn('Nombre del tutor obligatorio.');
        return;
      }
      if ((this.tutorDocNumber || '').trim().length < 5) {
        this.toast.warn('Documento del tutor obligatorio.');
        return;
      }
    }

    this.saving.set(true);
    const saveMinorTutor = (): void => {
      let body = renderContractHtml(tpl.content, c);
      if (minor) {
        body += minorGuardianDeclarationHtml(c, a, this.tutorName);
      }
      const payload = {
        appointment_id: a.id,
        is_minor: minor,
        health_data: { source: 'angular_panel', template_id: tpl.id },
        signature: client!,
        tutor_signature: tutorSig,
        artist_signature: this.artistSig(),
        tutor_document_front: minor ? this.tutorDocFront() : null,
        tutor_document_back: minor ? this.tutorDocBack() : null,
        contract_text: body,
        template_id: tpl.id,
      };
      this.signingApi.signContract(payload).subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Contrato firmado correctamente.');
          this.apptStore.invalidate();
          void this.router.navigateByUrl('/citas');
        },
        error: (err) => {
          this.saving.set(false);
          this.errors.handle(err);
        },
      });
    };

    if (minor) {
      this.customersApi
        .update(c.id, {
          first_name: c.firstName,
          last_name: c.lastName,
          birth_date: c.birthDate,
          document_type: c.documentType,
          document_number: c.documentNumber,
          document_issue_date: c.documentIssueDate,
          email: c.email,
          phone_number: c.phoneNumber,
          address: c.address,
          nationality: c.nationality,
          profession: c.profession,
          social_media: c.socialMedia,
          emergency_contact_name: c.emergencyContactName,
          emergency_contact_phone: c.emergencyContactPhone,
          is_minor: true,
          guardian_name: this.tutorName.trim(),
          guardian_document_type: this.tutorDocType,
          guardian_document_number: this.tutorDocNumber.trim(),
          guardian_document_issue_date: this.tutorDocIssue || null,
        })
        .subscribe({
          next: () => saveMinorTutor(),
          error: (err) => {
            this.saving.set(false);
            this.errors.handle(err);
          },
        });
    } else {
      saveMinorTutor();
    }
  }

  saveArtistOnly(): void {
    const a = this.appointment();
    const sig = this.artistSig();
    if (!a) return;
    if (!isSignatureAcceptable(sig)) {
      this.toast.warn('Dibuja tu firma antes de guardar.');
      return;
    }
    this.saving.set(true);
    this.signingApi
      .completeArtistSignature({ appointment_id: a.id, artist_signature: sig! })
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Firma del profesional registrada.');
          this.apptStore.invalidate();
          void this.router.navigateByUrl('/citas');
        },
        error: (err) => {
          this.saving.set(false);
          this.errors.handle(err);
        },
      });
  }
}
