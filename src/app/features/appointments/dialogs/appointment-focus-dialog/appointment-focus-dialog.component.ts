import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AppointmentDialogStore } from '../../appointment-dialog.store';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppPillComponent } from '../../../../shared/ui/pill/app-pill.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { CustomersApiService } from '../../services/customers-api.service';
import { AppointmentsApiService } from '../../services/appointments-api.service';
import { PanelStaffApiService } from '../../services/panel-staff-api.service';
import { CustomerSnapshot, PanelStaffOption } from '../../models/booking.model';
import { copToMiles, mapAppointment, milesToCop } from '../../models/appointment.mapper';
import {
  canCancelAppointment,
  firmarContratoDisabled,
  firmarContratoLabel,
  montosLockedForAppointment,
  reprogramDisabledForRow,
} from '../../models/appointment-policy';
import {
  appointmentDetailPlainBody,
  rebuildDetailForPatch,
  splitDesignObsPlain,
} from '../../models/appointment-detail-text.mapper';
import {
  appointmentBlockEndSlot,
  combineAppointmentDatetime,
  durationSlotsFromStartEnd,
  endBlockSlotOptions,
  parseExistingAppointmentSlot,
  timeSlotOptions,
} from '../../models/appointment-slots';
import { durationSlotsForRow } from '../../models/agenda-slots.mapper';
import {
  appointmentToScheduleKind,
  inferWorkKindFromAppointment,
  workKindToAssigneeRole,
} from '../../models/booking.mapper';
import {
  appointmentsForArtistSchedule,
  availableStartSlots,
  busySlotIndices,
} from '../../models/schedule.mapper';
import { clientPillKind } from '../../models/calendar.mapper';
import { resolveAppointmentModalId } from '../appointment-modal.util';
import { Appointment } from '../../models/appointment.model';
import { AppointmentAbonosSectionComponent } from '../../components/appointment-abonos-section/appointment-abonos-section.component';
import { apiErrorMessage } from '../../../../core/services/api.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';
import { MIN_APPOINTMENT_TOTAL_COP } from '../../models/booking.model';
import { AppStore } from '../../../../store/app.store';
import {
  canManageAppointmentAmounts,
  isTechnicianRole,
} from '../../../../core/utils/panel-roles';
import { of, switchMap } from 'rxjs';

@Component({
  selector: 'app-appointment-focus-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    AppPillComponent,
    AppButtonComponent,
    AppSkeletonComponent,
    AppointmentAbonosSectionComponent,
  ],
  template: `
    <div class="ap-ficha-panel-root">
      @if (dlg.loading()) {
        <app-skeleton [rows]="8" />
      } @else if (dlg.error()) {
        <p class="form-field__error">{{ dlg.error() }}</p>
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      } @else if (appt()) {
        @let a = appt()!;

        <section class="ap-ficha-split" aria-label="Cliente y horario">
          <div class="ap-ficha-split__col">
            <p class="ap-ficha-section-band">Cliente</p>
            <div class="ap-ficha-block ap-ficha-block--compact ap-ficha-block--client">
              <div class="ap-ficha-client-stack">
                <p class="ap-ficha-strong ap-ficha-strong--inline">
                  <span class="cli-pill cli-pill-{{ clientPillKind(a) }}">{{ customerName() }}</span>
                  @if (customer(); as c) {
                    <span class="ap-ficha-client-id">{{ c.documentType }} {{ c.documentNumber }}</span>
                  }
                </p>
                <p class="ap-ficha-client-line">
                  @if (customer(); as c) {
                    <span>{{ c.phoneNumber || a.phone || '—' }}</span>
                    <span class="ap-ficha-client-line__sep" aria-hidden="true">·</span>
                    <span>{{ c.email || '—' }}</span>
                  } @else {
                    <span>{{ a.phone || '—' }}</span>
                  }
                </p>
              </div>
            </div>
          </div>

          <div class="ap-ficha-split__col">
            <p class="ap-ficha-section-band">Horario</p>
            <div class="ap-ficha-block ap-ficha-block--compact ap-ficha-block--schedule">
              <div class="ap-ficha-field-row">
                <label class="ap-ficha-field">
                  <span class="ap-ficha-label">Inicio</span>
                  <select
                    class="ap-ficha-control"
                    [ngModel]="startSlot()"
                    (ngModelChange)="onStartSlotChange($event)"
                    [disabled]="!scheduleEditable()"
                  >
                    @for (s of startSlotChoices(); track s) {
                      <option [value]="s">{{ formatScheduleDateTime(s) }}</option>
                    }
                  </select>
                </label>
                <label class="ap-ficha-field">
                  <span class="ap-ficha-label">Fin</span>
                  <select
                    class="ap-ficha-control"
                    [ngModel]="endSlot()"
                    (ngModelChange)="endSlot.set($event)"
                    [disabled]="!scheduleEditable()"
                  >
                    @for (s of endSlotChoices(); track s) {
                      <option [value]="s">{{ formatScheduleDateTime(s) }}</option>
                    }
                  </select>
                </label>
              </div>
              @if (!scheduleEditable() && scheduleLocked()) {
                <p class="ap-ficha-hint">
                  Horario bloqueado: no admite cambio desde aquí.
                </p>
              }
              @if (artistDirty() && scheduleEditable()) {
                <p class="ap-ficha-hint">
                  Cambiaste de artista: ajusta inicio y fin según disponibilidad.
                </p>
              }
            </div>
          </div>
        </section>

        <section class="ap-ficha-service" aria-label="Cita servicio">
          <div class="ap-ficha-section-band ap-ficha-section-band--split">
            <span>Cita · servicio</span>
            <span class="ap-ficha-section-band__meta">Recibo {{ receiptIdsLabel() }}</span>
          </div>
          <div class="ap-ficha-service__body">
            <div class="ap-ficha-field-row">
              <label class="ap-ficha-field">
                <span class="ap-ficha-label">Artista</span>
                @if (staffForAppt().length) {
                  <select
                    class="ap-ficha-control"
                    [ngModel]="selectedArtistId()"
                    (ngModelChange)="onArtistChange($event)"
                    [disabled]="artistLocked()"
                  >
                    @for (s of staffForAppt(); track s.id) {
                      <option [ngValue]="s.id">{{ s.label }}</option>
                    }
                  </select>
                } @else {
                  <input class="ap-ficha-control" type="text" [value]="a.assignedLabel" disabled />
                }
              </label>
              <label class="ap-ficha-field">
                <span class="ap-ficha-label">Valor del trabajo</span>
                <input
                  class="ap-ficha-control"
                  type="number"
                  min="0"
                  step="1"
                  [ngModel]="totalValue()"
                  (ngModelChange)="totalValue.set(+$event || 0)"
                  [disabled]="montosLocked()"
                />
              </label>
            </div>
            @if (a.hasSignedContract) {
              <p class="ap-ficha-hint">
                El artista no se puede cambiar si ya existe contrato firmado en esta cita.
              </p>
            }
            <div class="ap-ficha-field-row ap-ficha-field-row--textareas">
              <label class="ap-ficha-field">
                <span class="ap-ficha-label">Descripción del diseño</span>
                <textarea
                  class="ap-ficha-control"
                  rows="2"
                  [ngModel]="designText()"
                  (ngModelChange)="designText.set($event)"
                  [disabled]="montosLocked()"
                ></textarea>
              </label>
              <label class="ap-ficha-field">
                <span class="ap-ficha-label">Observaciones</span>
                <textarea
                  class="ap-ficha-control"
                  rows="2"
                  [ngModel]="obsText()"
                  (ngModelChange)="obsText.set($event)"
                  [disabled]="montosLocked()"
                ></textarea>
              </label>
            </div>
          </div>
          @if (canManageFicha()) {
            <div class="ap-ficha-service__footer">
              <label class="ap-ficha-check">
                <input
                  type="checkbox"
                  [ngModel]="isPriority()"
                  (ngModelChange)="isPriority.set($event)"
                  [disabled]="montosLocked()"
                />
                Cita prioritaria
              </label>
              <div class="ap-ficha-service__footer-actions">
                <app-button
                  variant="ghost"
                  [disabled]="reprogramDisabled()"
                  (clicked)="openReschedule()"
                >
                  Reprogramar
                </app-button>
                <app-button variant="ghost" [disabled]="!canCancel()" (clicked)="openCancel()">
                  Cancelar
                </app-button>
              </div>
            </div>
          }
        </section>

        <app-appointment-abonos-section
          [montosLocked]="montosLocked()"
          [totalOverride]="totalValueCop()"
        />

        @if (a.contractPendingArtistSignature) {
          <p class="cal-overflow-fire-pending appt-detail-fire">Firma profesional pendiente</p>
        }

        <div class="ap-ficha-actions">
          @if (canManageFicha()) {
            <app-button variant="primary" [loading]="saving()" (clicked)="saveChanges()">
              Guardar cambios
            </app-button>
            <app-button variant="ghost" [disabled]="firmarDisabled()" (clicked)="onFirmarContrato()">
              {{ firmarLabel() }}
            </app-button>
          } @else if (isTechnician()) {
            <app-button variant="ghost" [disabled]="firmarDisabled()" (clicked)="onFirmarContrato()">
              {{ firmarLabel() }}
            </app-button>
          }
          <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
        </div>
      } @else {
        <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
      }
    </div>
  `,
})
export class AppointmentFocusDialogComponent {
  protected readonly dlg = inject(AppointmentDialogStore);
  private readonly ui = inject(UiStore);
  private readonly apptStore = inject(AppointmentsStore);
  private readonly appStore = inject(AppStore);
  private readonly customersApi = inject(CustomersApiService);
  private readonly api = inject(AppointmentsApiService);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly abonosSection = viewChild(AppointmentAbonosSectionComponent);

  protected readonly clientPillKind = (a: Appointment) =>
    clientPillKind(a, this.apptStore.clientHistoryCounts());

  readonly slotOptions = timeSlotOptions();

  readonly customer = signal<CustomerSnapshot | null>(null);
  readonly staffList = signal<PanelStaffOption[]>([]);
  readonly startSlot = signal('09:00');
  readonly endSlot = signal('09:30');
  readonly appointmentDay = signal<Date>(new Date());
  readonly selectedArtistId = signal(0);
  readonly designText = signal('');
  readonly obsText = signal('');
  readonly totalValue = signal(0);
  /** Total en COP para validaciones de abonos (input de trabajo está en miles). */
  readonly totalValueCop = computed(() => milesToCop(this.totalValue()));
  readonly isPriority = signal(false);
  readonly saving = signal(false);

  private seededForId: number | null = null;
  private baseTotal = 0;
  private basePriority = false;
  private baseDesign = '';
  private baseObs = '';
  private baseStart = '09:00';
  private baseEnd = '09:30';
  private baseArtistId = 0;

  readonly appt = this.dlg.appointment;

  readonly isTechnician = computed(() =>
    isTechnicianRole(this.appStore.user()?.role ?? ''),
  );

  /** Edición de ficha/montos (admin/vendedor y estado editable). */
  readonly canManageFicha = computed(() => {
    const a = this.appt();
    if (!a) return false;
    const role = this.appStore.user()?.role ?? '';
    if (!canManageAppointmentAmounts(role)) return false;
    return !montosLockedForAppointment(a);
  });

  readonly montosLocked = computed(() => {
    const a = this.appt();
    if (!a) return true;
    return montosLockedForAppointment(a, this.appStore.user()?.role ?? '');
  });

  readonly artistLocked = computed(() => {
    const a = this.appt();
    return !a || a.hasSignedContract || this.montosLocked();
  });

  readonly artistDirty = computed(() => {
    const cur = this.selectedArtistId();
    return cur > 0 && cur !== this.baseArtistId;
  });

  readonly scheduleLocked = computed(() => {
    const a = this.appt();
    if (!a) return true;
    return reprogramDisabledForRow(a);
  });

  /** Horario editable si la cita lo permite o si cambió el artista. */
  readonly scheduleEditable = computed(() => {
    if (this.montosLocked()) return false;
    if (this.artistDirty()) return true;
    return !this.scheduleLocked();
  });

  readonly durationSlotsCount = computed(() =>
    durationSlotsFromStartEnd(this.startSlot(), this.endSlot(), this.slotOptions),
  );

  readonly startSlotChoices = computed(() => {
    if (!this.scheduleEditable()) {
      return this.slotOptions.includes(this.startSlot())
        ? [this.startSlot()]
        : this.slotOptions;
    }
    const need = this.durationSlotsCount();
    const busy = this.busyIndices();
    const avail = availableStartSlots(this.slotOptions, need, busy);
    const cur = this.startSlot();
    if (cur && !avail.includes(cur)) return [cur, ...avail];
    return avail.length ? avail : this.slotOptions;
  });

  readonly endSlotChoices = computed(() => {
    if (!this.scheduleEditable()) {
      return [this.endSlot()];
    }
    return this.validEndOptions();
  });

  readonly staffForAppt = computed(() => {
    const a = this.appt();
    if (!a) return [];
    const role = workKindToAssigneeRole(inferWorkKindFromAppointment(a));
    const filtered = this.staffList().filter((s) => s.role === role);
    const list = filtered.length ? [...filtered] : [...this.staffList()];
    const curId = this.selectedArtistId() || a.assignedPanelUserId || 0;
    if (curId > 0 && !list.some((s) => s.id === curId)) {
      list.unshift({
        id: curId,
        username: '',
        firstName: '',
        lastName: '',
        role: role,
        label: a.assignedLabel || `#${curId}`,
      });
    }
    return list;
  });

  readonly customerName = computed(() => {
    const c = this.customer();
    const a = this.appt();
    if (c) return `${c.firstName} ${c.lastName}`.trim() || a?.customerName || '—';
    return a?.customerName ?? '—';
  });

  readonly receiptIdsLabel = computed(() => {
    const ids = this.dlg.receipts().map((r) => r.id).filter((id) => id > 0);
    return ids.length ? ids.join(', ') : '—';
  });

  readonly reprogramDisabled = computed(() => {
    const a = this.appt();
    return !a || reprogramDisabledForRow(a);
  });

  readonly canCancel = computed(() => {
    const a = this.appt();
    return a ? canCancelAppointment(a) : false;
  });

  readonly firmarDisabled = computed(() => {
    const a = this.appt();
    return !a || firmarContratoDisabled(a, this.dlg.payments());
  });

  readonly firmarLabel = computed(() => {
    const a = this.appt();
    return a ? firmarContratoLabel(a) : 'Firmar contrato';
  });

  private readonly _load = effect(() => {
    const id = resolveAppointmentModalId(this.ui);
    if (id <= 0 || this.ui.activeModal()?.id !== 'appointment-focus') return;
    const cached = this.apptStore.filteredItems().find((x) => x.id === id);
    if (cached) this.dlg.patchAppointmentLocal(cached);
    this.dlg.loadAppointment(id);
    this.dlg.loadPayments(id);
    this.dlg.loadReceipts(id);
    this.staffApi.listAssignable().subscribe((list) => this.staffList.set(list));
  });

  private readonly _syncForm = effect(() => {
    const a = this.appt();
    if (!a || this.ui.activeModal()?.id !== 'appointment-focus') return;
    if (this.seededForId === a.id) return;

    this.seededForId = a.id;

    const plain = appointmentDetailPlainBody(a.detail);
    const { design, observations } = splitDesignObsPlain(plain);
    this.designText.set(design);
    this.obsText.set(observations);
    this.baseDesign = design;
    this.baseObs = observations;

    this.totalValue.set(copToMiles(a.financials.total));
    this.baseTotal = copToMiles(a.financials.total);
    this.isPriority.set(a.isPriority);
    this.basePriority = a.isPriority;

    const dur = durationSlotsForRow(a);
    const { slot, date } = parseExistingAppointmentSlot(
      a.appointmentDateRaw ?? a.appointmentDate,
    );
    this.appointmentDay.set(date);
    this.startSlot.set(slot);
    const end = appointmentBlockEndSlot(slot, dur, this.slotOptions);
    this.endSlot.set(end);
    this.baseStart = slot;
    this.baseEnd = end;

    const aid = a.assignedPanelUserId ?? 0;
    this.selectedArtistId.set(aid);
    this.baseArtistId = aid;

    const cid = a.customerId;
    if (cid != null && cid > 0) {
      this.customersApi.getSnapshotById(cid).subscribe((c) => this.customer.set(c));
    } else {
      this.customer.set(null);
    }
  });

  onArtistChange(artistId: number): void {
    this.selectedArtistId.set(Number(artistId) || 0);
    if (this.artistDirty()) {
      this.adjustScheduleForArtist();
    }
  }

  onStartSlotChange(hm: string): void {
    this.startSlot.set(hm);
    const ends = this.validEndOptions();
    if (!ends.includes(this.endSlot())) {
      const prevDur = durationSlotsFromStartEnd(this.baseStart, this.baseEnd, this.slotOptions);
      const preferred = appointmentBlockEndSlot(hm, prevDur, this.slotOptions);
      this.endSlot.set(
        ends.includes(preferred) ? preferred : (ends[0] ?? preferred),
      );
    }
  }

  private busyIndices(): Set<number> {
    const a = this.appt();
    if (!a) return new Set();
    const artistId = this.selectedArtistId() || null;
    const kind = appointmentToScheduleKind(a);
    const dayRows = appointmentsForArtistSchedule(
      this.apptStore.filteredItems(),
      this.appointmentDay(),
      artistId,
      kind,
      a.id,
    );
    return busySlotIndices(dayRows, this.slotOptions);
  }

  private validEndOptions(): string[] {
    const baseEnds = endBlockSlotOptions(this.startSlot(), this.slotOptions);
    const si = this.slotOptions.indexOf(this.startSlot());
    if (si < 0) return baseEnds;
    const busy = this.busyIndices();
    return baseEnds.filter((endHm) => {
      const dur = durationSlotsFromStartEnd(this.startSlot(), endHm, this.slotOptions);
      for (let j = si; j < si + dur; j++) {
        if (busy.has(j)) return false;
      }
      return true;
    });
  }

  private adjustScheduleForArtist(): void {
    const need = this.durationSlotsCount();
    const busy = this.busyIndices();
    const starts = availableStartSlots(this.slotOptions, need, busy);
    if (starts.length && !starts.includes(this.startSlot())) {
      this.startSlot.set(starts[0]);
    }
    const ends = this.validEndOptions();
    if (ends.length && !ends.includes(this.endSlot())) {
      this.endSlot.set(ends[0]);
    } else if (!ends.length) {
      this.toast.warn(
        'No hay franjas libres para este artista en el día de la cita; elige otra hora.',
      );
    }
  }

  /** Etiqueta de opción: DD-MM-YYYY HH:MM */
  formatScheduleDateTime(hm: string): string {
    const day = this.appointmentDay();
    if (!day || Number.isNaN(day.getTime())) return hm || '—';
    const dd = String(day.getDate()).padStart(2, '0');
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const yyyy = day.getFullYear();
    const time = (hm || '').trim() || '—';
    return `${dd}-${mm}-${yyyy} ${time}`;
  }

  formatAppointmentDay(day: Date): string {
    if (!day || Number.isNaN(day.getTime())) return '—';
    const dd = String(day.getDate()).padStart(2, '0');
    const mm = String(day.getMonth() + 1).padStart(2, '0');
    const yyyy = day.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  }

  saveChanges(): void {
    const a = this.appt();
    if (!a || this.montosLocked()) return;

    const abonos = this.abonosSection();
    const payDirty = abonos?.hasUnsavedPaymentEdit() ?? false;
    const payBlocker = abonos?.paymentEditBlocker() ?? null;
    if (payBlocker) {
      this.toast.warn(payBlocker);
      return;
    }

    const tot = milesToCop(this.totalValue());
    const dep = a.financials.deposit;
    const credit = a.financials.credit;
    const dur = this.durationSlotsCount();

    const totDirty = this.totalValue() !== this.baseTotal;
    const schedDirty =
      this.scheduleEditable() &&
      (this.startSlot() !== this.baseStart ||
        this.endSlot() !== this.baseEnd ||
        dur !== durationSlotsFromStartEnd(this.baseStart, this.baseEnd, this.slotOptions));
    const textDirty =
      this.designText() !== this.baseDesign || this.obsText() !== this.baseObs;
    const artDirty = this.artistDirty();
    const prioDirty = this.isPriority() !== this.basePriority;
    const fichaDirty = totDirty || schedDirty || textDirty || artDirty || prioDirty;

    if (!fichaDirty && !payDirty) {
      this.toast.info('No hay cambios que guardar.');
      return;
    }

    if (totDirty && tot < MIN_APPOINTMENT_TOTAL_COP) {
      this.toast.warn(
        `El valor total mínimo es COP $${MIN_APPOINTMENT_TOTAL_COP.toLocaleString('es-CO')}.`,
      );
      return;
    }
    if (totDirty && dep > tot + 0.01) {
      this.toast.warn('El valor total no puede ser menor que lo ya abonado.');
      return;
    }

    if (schedDirty) {
      const si = this.slotOptions.indexOf(this.startSlot());
      const busy = this.busyIndices();
      for (let j = si; j < si + dur; j++) {
        if (busy.has(j)) {
          this.toast.warn('La franja elegida no está disponible para el artista seleccionado.');
          return;
        }
      }
    }

    const detailFull = rebuildDetailForPatch(
      a,
      this.designText(),
      this.obsText(),
      schedDirty ? dur : undefined,
    );
    const detailMetaOnly = !schedDirty && textDirty ? detailFull : null;

    this.saving.set(true);

    const pending = Math.max(Math.round((tot - dep - credit) * 100) / 100, 0);

    const savePayment$ = abonos?.commitPaymentEdit$() ?? of(false);

    const saveFinancials$ = totDirty
      ? this.api.patchFinancials(a.id, tot, dep, pending)
      : of(null);

    savePayment$
      .pipe(
        switchMap(() => saveFinancials$),
        switchMap(() => {
          if (!schedDirty) return of(null);
          const dt = combineAppointmentDatetime(this.appointmentDay(), this.startSlot());
          return this.api.patchReschedule(a.id, dt, detailFull);
        }),
        switchMap(() => {
          const metaNeed = artDirty || prioDirty || detailMetaOnly != null;
          if (!metaNeed) return of(null);
          return this.api.patchMeta(a.id, {
            assignedPanelUserId: artDirty ? this.selectedArtistId() : undefined,
            isPriority: this.isPriority(),
            detail: detailMetaOnly,
          });
        }),
      )
      .subscribe({
        next: () => {
          this.saving.set(false);
          this.toast.success('Cambios guardados en la cita.');
          this.seededForId = null;
          this.reloadAppointment(a.id);
        },
        error: (err) => {
          this.saving.set(false);
          this.toast.error(err instanceof Error ? err.message : apiErrorMessage(err));
        },
      });
  }

  openReschedule(): void {
    const a = this.appt();
    if (!a) return;
    this.ui.openModal('appointment-reschedule', { appointmentId: a.id });
  }

  openCancel(): void {
    const a = this.appt();
    if (!a) return;
    this.ui.openModal('appointment-cancel', { appointmentId: a.id });
  }

  onFirmarContrato(): void {
    const a = this.appt();
    if (!a) return;
    const artistOnly = a.hasSignedContract && a.contractPendingArtistSignature;
    void this.router.navigate(['/citas', 'firmar', a.id], {
      queryParams: artistOnly ? { artistOnly: '1' } : {},
    });
    this.close();
  }

  private reloadAppointment(id: number): void {
    this.api.get(id).subscribe({
      next: (row) => {
        const appt = mapAppointment(row);
        this.dlg.patchAppointmentLocal(appt);
        this.apptStore.mergeAppointment(row);
        this.apptStore.invalidate();
      },
    });
  }

  close(): void {
    this.ui.closeModal();
    this.dlg.reset();
    this.customer.set(null);
    this.seededForId = null;
  }
}
