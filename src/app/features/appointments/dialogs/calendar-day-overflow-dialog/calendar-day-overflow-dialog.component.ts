import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { UiStore } from '../../../../store/ui.store';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { CalendarDayOverflowModalData } from '../../models/appointment-modal.model';
import { appointmentRowDate, dayKeyFromDate, toCalendarSlotView } from '../../models/calendar.mapper';
import { CalendarOverflowRowComponent } from '../../components/calendar-overflow-row/calendar-overflow-row.component';

@Component({
  selector: 'app-calendar-day-overflow-dialog',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [AppButtonComponent, CalendarOverflowRowComponent],
  template: `
    @if (dayLabel()) {
      <p class="appt-dialog-caption">
        <strong>{{ dayLabel() }}</strong> · {{ slots().length }} cita(s)
      </p>
    }
    <div class="cal-overflow-list">
      @for (slot of slots(); track slot.id) {
        <app-calendar-overflow-row [slot]="slot" (open)="openDetail($event)" />
      }
    </div>
    <div class="appt-dialog-actions">
      <app-button variant="ghost" (clicked)="close()">Cerrar</app-button>
    </div>
  `,
})
export class CalendarDayOverflowDialogComponent {
  private readonly store = inject(AppointmentsStore);
  private readonly ui = inject(UiStore);

  readonly dayLabel = computed(() => {
    const data = this.ui.activeModal()?.data as CalendarDayOverflowModalData | undefined;
    const raw = data?.pickedDate ?? '';
    if (!raw) return '';
    return appointmentRowDate(raw).toLocaleDateString('es-CO');
  });

  readonly slots = computed(() => {
    const data = this.ui.activeModal()?.data as CalendarDayOverflowModalData | undefined;
    const raw = data?.pickedDate ?? '';
    if (!raw) return [];
    const d = appointmentRowDate(raw);
    const key = dayKeyFromDate(d);
    const rows = this.store.appointmentsByDay().get(key) ?? [];
    const counts = this.store.clientHistoryCounts();
    return rows.map((r) => toCalendarSlotView(r, counts));
  });

  openDetail(id: number): void {
    this.ui.closeModal();
    this.ui.openModal('appointment-focus', { appointmentId: id });
  }

  close(): void {
    this.ui.closeModal();
  }
}
