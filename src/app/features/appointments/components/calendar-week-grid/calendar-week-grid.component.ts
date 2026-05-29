import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import { AppointmentsStore } from '../../appointments.store';
import { buildWeekScheduleView } from '../../models/week-schedule.mapper';
import { CalendarWeekAppointmentBlockComponent } from '../calendar-week-appointment-block/calendar-week-appointment-block.component';

@Component({
  selector: 'app-calendar-week-grid',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CalendarWeekAppointmentBlockComponent],
  template: `
    @if (view(); as v) {
      <div class="twg-shell">
        <div class="twg-scroll-x">
          <div class="twg-grid-wrap">
            <div class="twg-head">
              <div class="twg-h-spacer" aria-hidden="true"></div>
              <div class="twg-h-days">
                @for (hdr of v.dayHeaders; track hdr.date.getTime()) {
                  <div class="twg-h-day" [class.twg-h-today]="hdr.isToday">
                    <div class="twg-h-wd">{{ hdr.weekdayLabel }}</div>
                    <div class="twg-h-num">{{ hdr.dayNum }}</div>
                    @if (showBookFooter()) {
                      <div
                        class="cal-cell-footer-strip twg-h-footer-strip"
                        [class.cal-footer-strip-disabled]="hdr.isPast"
                      >
                        <button
                          type="button"
                          class="cal-footer-book btn btn--ghost"
                          [disabled]="hdr.isPast"
                          [title]="bookTitle(hdr.isPast, hdr.date)"
                          (click)="bookDay.emit(hdr.date)"
                        >
                          + Agendar
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            </div>

            <div class="twg-body">
              <div class="twg-times" aria-hidden="true">
                @for (hm of v.slotList; track hm) {
                  <div
                    class="twg-tick"
                    [class.twg-tick-major]="hm.endsWith(':00')"
                    [class.twg-tick-minor]="!hm.endsWith(':00')"
                    [style.height.px]="v.slotPx"
                  >
                    <span>{{ hm.endsWith(':00') ? hm : '' }}</span>
                  </div>
                }
              </div>
              <div class="twg-day-columns">
                @for (col of v.dayColumns; track col.date.getTime()) {
                  <div
                    class="twg-col"
                    [class.twg-col-today]="col.isToday"
                    [style.height.px]="col.totalHeightPx"
                  >
                    @for (si of slotIndices(v); track si) {
                      <div
                        class="twg-slot-line"
                        [style.top.px]="si * v.slotPx"
                        [style.height.px]="v.slotPx"
                      ></div>
                    }
                    @for (blk of col.blocks; track blk.appointmentId) {
                      <app-calendar-week-appointment-block
                        [block]="blk"
                        (selected)="selected.emit($event)"
                      />
                    }
                  </div>
                }
              </div>
            </div>
          </div>
        </div>
      </div>
    }
  `,
})
export class CalendarWeekGridComponent {
  protected readonly store = inject(AppointmentsStore);
  readonly showBookFooter = input(true);
  readonly selected = output<number>();
  readonly bookDay = output<Date>();

  readonly view = computed(() =>
    buildWeekScheduleView(
      this.store.weekMondayIso(),
      this.store.appointmentsByDay(),
      this.store.clientHistoryCounts(),
    ),
  );

  slotIndices(v: { slotList: string[] }): number[] {
    return v.slotList.map((_, i) => i);
  }

  bookTitle(isPast: boolean, d: Date): string {
    if (isPast) return 'No se pueden agendar citas en fechas pasadas';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `Agendar cita · ${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()}`;
  }
}
