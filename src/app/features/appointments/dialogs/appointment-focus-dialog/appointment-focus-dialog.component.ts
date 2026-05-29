import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  signal,
} from '@angular/core';
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
import { mapAppointment, statusToPillVariant } from '../../models/appointment.mapper';
import {
  canCancelAppointment,
  firmarContratoDisabled,
  firmarContratoLabel,
  montosLockedForAppointment,
  reprogramDisabledForRow,
} from '../../models/appointment-policy';
import {
  appointmentDetailPlainBody,
  formatAppointmentCreatedAtDisplay,
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
        <header class="ap-ficha-header">
          <div>
            <h3 class="ap-ficha-title">Cita</h3>
            <p class="ap-ficha-meta">
              {{ formatCreated(a.createdAt) }} · Cita #{{ a.id }}
            </p>
          </div>
          <app-pill [variant]="statusToPillVariant(a.status)" [label]="a.statusLabel" />
        </header>

        <p class="ap-ficha-section-band">Cliente</p>
        <div class="ap-ficha-block">
          <p class="ap-ficha-strong">
            Cliente:
            <span class="cli-pill cli-pill-{{ clientPillKind(a) }}">{{ customerName() }}</span>
          </p>
          @if (customer(); as c) {
            <p class="ap-ficha-caption">
              {{ c.documentType }} {{ c.documentNumber }} · ✉ {{ c.email || '—' }} · 📱
              {{ c.phoneNumber || a.phone || '—' }}
            </p>
          } @else {
            <p class="ap-ficha-caption">📱 Teléfono en cita: {{ a.phone || '—' }}</p>
          }
        </div>

        <p class="ap-ficha-section-band">Horario</p>
        <div class="ap-ficha-grid2">
          <label>
            <span class="ap-ficha-col-head ap-ficha-col-head--wide">Desde (inicio)</span>
            <select
              class="ap-ficha-control"
              [ngModel]="startSlot()"
              (ngModelChange)="onStartSlotChange($event)"
              [disabled]="!scheduleEditable()"
            >
              @for (s of startSlotChoices(); track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>
          <label>
            <span class="ap-ficha-col-head ap-ficha-col-head--wide">Hasta (fin del bloque)</span>
            <select
              class="ap-ficha-control"
              [ngModel]="endSlot()"
              (ngModelChange)="endSlot.set($event)"
              [disabled]="!scheduleEditable()"
            >
              @for (s of endSlotChoices(); track s) {
                <option [value]="s">{{ s }}</option>
              }
            </select>
          </label>
        </div>
        @if (!scheduleEditable() && scheduleLocked()) {
          <p class="ap-ficha-hint">
            Horario bloqueado: estado cerrado o la cita no admite cambio de franja desde aquí.
          </p>
        }
        @if (artistDirty() && scheduleEditable()) {
          <p class="ap-ficha-hint">
            Cambiaste de artista: elige de nuevo inicio y fin según la disponibilidad del profesional.
          </p>
        }

        <p class="ap-ficha-section-band">Cita · servicio</p>
        <p class="ap-ficha-caption ap-ficha-caption--rec">
          Recibo id(s) — solo lectura: {{ receiptIdsLabel() }}
        </p>
        <div class="ap-ficha-grid2 ap-ficha-grid2--service">
          <div class="ap-ficha-col">
            <label>
              <span class="ap-ficha-col-head">Artista</span>
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
            <label>
              <span class="ap-ficha-col-head">Valor del tatuaje / trabajo (COP, entero)</span>
              <input
                class="ap-ficha-control"
                type="number"
                min="0"
                step="1000"
                [ngModel]="totalValue()"
                (ngModelChange)="totalValue.set(+$event || 0)"
                [disabled]="montosLocked()"
              />
            </label>
            <label class="ap-ficha-check">
              <input
                type="checkbox"
                [ngModel]="isPriority()"
                (ngModelChange)="isPriority.set($event)"
                [disabled]="montosLocked()"
              />
              Cita prioritaria
            </label>
            @if (a.hasSignedContract) {
              <p class="ap-ficha-hint">
                El artista no se puede cambiar si ya existe contrato firmado en esta cita.
              </p>
            }
          </div>
          <div class="ap-ficha-col">
            <label>
              <span class="ap-ficha-col-head">Descripción del diseño</span>
              <textarea
                class="ap-ficha-control"
                rows="5"
                [ngModel]="designText()"
                (ngModelChange)="designText.set($event)"
                [disabled]="montosLocked()"
              ></textarea>
            </label>
            <label>
              <span class="ap-ficha-col-head">Observaciones</span>
              <textarea
                class="ap-ficha-control"
                rows="4"
                [ngModel]="obsText()"
                (ngModelChange)="obsText.set($event)"
                [disabled]="montosLocked()"
              ></textarea>
            </label>
          </div>
        </div>

        <app-appointment-abonos-section
          [montosLocked]="montosLocked()"
          [totalOverride]="totalValue()"
        />

        @if (a.contractPendingArtistSignature) {
          <p class="cal-overflow-fire-pending appt-detail-fire">Firma profesional pendiente</p>
        }

        <h4 class="ap-ficha-actions-title">Acciones</h4>
        @if (!montosLocked()) {
          <div class="ap-ficha-actions">
            <app-button variant="primary" [loading]="saving()" (clicked)="saveChanges()">
              Guardar cambios
            </app-button>
            <app-button
              variant="ghost"
              [disabled]="reprogramDisabled()"
              (clicked)="openReschedule()"
            >
              Reprogramar
            </app-button>
            <app-button variant="ghost" [disabled]="!canCancel()" (clicked)="openCancel()">
              Cancelar cita
            </app-button>
            <app-button variant="ghost" [disabled]="firmarDisabled()" (clicked)="onFirmarContrato()">
              {{ firmarLabel() }}
            </app-button>
          </div>
        }
        <div class="ap-ficha-actions-close">
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
  private readonly customersApi = inject(CustomersApiService);
  private readonly api = inject(AppointmentsApiService);
  private readonly staffApi = inject(PanelStaffApiService);
  private readonly toast = inject(ToastService);

  protected readonly statusToPillVariant = statusToPillVariant;
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

  readonly montosLocked = computed(() => {
    const a = this.appt();
    return a ? montosLockedForAppointment(a) : true;
  });

  readonly artistLocked = computed(() => {
    const a = this.appt();
    return !a || a.hasSignedContract;
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
    return !a || firmarContratoDisabled(a);
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

    this.totalValue.set(Math.round(a.financials.total));
    this.baseTotal = Math.round(a.financials.total);
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

  formatCreated(raw: string | null): string {
    return formatAppointmentCreatedAtDisplay(raw);
  }

  saveChanges(): void {
    const a = this.appt();
    if (!a || this.montosLocked()) return;

    const tot = Math.round(this.totalValue());
    const dep = a.financials.deposit;
    const credit = a.financials.credit;
    const dur = this.durationSlotsCount();

    const totDirty = tot !== this.baseTotal;
    const schedDirty =
      this.scheduleEditable() &&
      (this.startSlot() !== this.baseStart ||
        this.endSlot() !== this.baseEnd ||
        dur !== durationSlotsFromStartEnd(this.baseStart, this.baseEnd, this.slotOptions));
    const textDirty =
      this.designText() !== this.baseDesign || this.obsText() !== this.baseObs;
    const artDirty = this.artistDirty();
    const prioDirty = this.isPriority() !== this.basePriority;

    if (!totDirty && !schedDirty && !textDirty && !artDirty && !prioDirty) {
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

    const saveFinancials$ = totDirty
      ? this.api.patchFinancials(a.id, tot, dep, pending)
      : of(null);

    saveFinancials$
      .pipe(
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
          this.toast.error(apiErrorMessage(err));
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
    this.toast.info(
      'El flujo de firma de contrato se gestiona desde el panel principal; migración en curso.',
    );
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
