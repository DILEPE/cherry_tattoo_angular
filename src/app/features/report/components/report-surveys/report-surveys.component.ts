import { DecimalPipe } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, take } from 'rxjs';
import { LoadingService } from '../../../../core/services/loading.service';
import { SurveyQuestionsApiService } from '../../services/survey-questions-api.service';
import { ReportStore } from '../../report.store';
import {
  CONTRACT_KIND_LABEL_ES,
  SURVEY_TYPE_LABEL_ES,
  SurveyQuestionStatRow,
  isSurveyTextQuestion,
} from '../../models/survey-stats.model';
import {
  buildSurveyStatsQueryParams,
  surveyStatsDateFilterLabel,
} from '../../models/survey-stats-query.util';
import {
  questionTypeSupportsChart,
  surveyChartEntries,
  surveyChartVariant,
} from '../../models/survey-chart.util';
import {
  downloadPngBase64,
  renderSurveyChartPngBase64,
  surveyChartPngFilename,
} from '../../models/survey-chart-canvas.util';
import { downloadSurveyStatsExcel } from '../../models/survey-stats-excel-export';
import { downloadSurveyTextResponsesExcel } from '../../models/survey-text-responses-excel-export';
import { SurveyBreakdownChartComponent } from '../survey-breakdown-chart/survey-breakdown-chart.component';
import { AppSkeletonComponent } from '../../../../shared/ui/skeleton/app-skeleton.component';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { ErrorService } from '../../../../core/services/error.service';
import { ToastService } from '../../../../shared/ui/toast/toast.service';



@Component({

  selector: 'app-report-surveys',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  imports: [
    FormsModule,
    AppSkeletonComponent,
    DecimalPipe,
    SurveyBreakdownChartComponent,
    AppButtonComponent,
  ],
  template: `
    <div class="report-surveys-head">
      <h3 class="report-section-title">Encuestas — satisfacción</h3>
      @if (!loading() && !error() && rows().length && hasResponsesInRange()) {
        <app-button
          variant="primary"
          [loading]="exporting()"
          (clicked)="downloadExcel()"
        >
          Descargar Excel con gráficas
        </app-button>
      }
    </div>

    <section class="report-search-panel" aria-labelledby="report-survey-filters-title">
      <div class="report-search-panel__head">
        <h4 id="report-survey-filters-title" class="report-search-panel__title">
          Filtro por fecha de cita
        </h4>
        <div class="report-search-panel__actions">
          <app-button variant="ghost" (clicked)="clearDateFilters()">Limpiar fechas</app-button>
        </div>
      </div>
      <p class="report-survey-filter-hint">{{ dateFilterLabel() }}</p>
      <div class="report-search-panel__grid report-search-panel__grid--dates">
        <label class="report-search-panel__field">
          <span class="report-search-panel__label">Desde</span>
          <input
            type="date"
            class="report-search-panel__input"
            [ngModel]="store.filters().fromDate"
            (ngModelChange)="onFromDateChange($event)"
          />
        </label>
        <label class="report-search-panel__field">
          <span class="report-search-panel__label">Hasta</span>
          <input
            type="date"
            class="report-search-panel__input"
            [ngModel]="store.filters().toDate"
            (ngModelChange)="onToDateChange($event)"
          />
        </label>
      </div>
    </section>

    @if (loading()) {
      <app-skeleton [rows]="5" />
    } @else if (error()) {
      <p class="empty-state">{{ error() }}</p>
    } @else if (!rows().length) {
      <p class="empty-state">No hay preguntas registradas o la lista está vacía.</p>
    } @else if (!hasResponsesInRange()) {
      <p class="empty-state">
        No hay respuestas de encuesta en el rango de fechas seleccionado.
      </p>
    } @else {

      @for (row of rows(); track row.question_id) {

        <article class="report-survey-card">

          <div class="report-survey-card__head">

            <h4 class="report-survey-title">

              {{ row.label }}

              <span class="report-survey-meta">

                · {{ typeLabel(row.question_type) }}

                · {{ kindLabel(row.contract_kind) }}

                · n = {{ row.response_count }}

              </span>

            </h4>

            <div class="report-survey-card__actions">
              @if (chartEntries(row).length) {
                <app-button
                  variant="ghost"
                  [loading]="exportingPngId() === row.question_id"
                  (clicked)="downloadChartPng(row)"
                >
                  PNG
                </app-button>
              }
              @if (isTextQuestion(row.question_type) && (row.text_response_count ?? 0) > 0) {
                <app-button
                  variant="ghost"
                  [loading]="exportingTextId() === row.question_id"
                  (clicked)="downloadTextExcel(row)"
                >
                  Descargar Excel
                </app-button>
              }
            </div>

          </div>



          @if (row.question_type === 'yes_no') {

            <div class="report-survey-metrics">

              <div class="report-metric">

                <span class="report-metric-label">Sí</span>

                <strong>{{ row.yes_count ?? 0 }}</strong>

              </div>

              <div class="report-metric">

                <span class="report-metric-label">No</span>

                <strong>{{ row.no_count ?? 0 }}</strong>

              </div>

            </div>

          }



          @if (row.question_type === 'rating_1_5' && row.avg_rating != null) {

            <div class="report-survey-metrics report-survey-metrics--single">

              <div class="report-metric">

                <span class="report-metric-label">Promedio (1–5)</span>

                <strong>{{ row.avg_rating | number: '1.2-2' }}</strong>

              </div>

            </div>

          }



          @if (row.question_type === 'number' && row.avg_number != null) {

            <div class="report-survey-metrics report-survey-metrics--single">

              <div class="report-metric">

                <span class="report-metric-label">Promedio numérico</span>

                <strong>{{ row.avg_number | number: '1.2-4' }}</strong>

              </div>

            </div>

          }



          @if (chartEntries(row).length) {

            <app-survey-breakdown-chart

              [entries]="chartEntries(row)"

              [variant]="chartVariant(row)"

              [title]="row.label"

            />

            @if (row.question_type === 'checkbox') {

              <p class="report-survey-caption report-survey-caption--chart">

                Casillas: cada sector puede ser una combinación guardada; si hay muchas

                categorías, el resto se agrupa en «Otros».

              </p>

            }

          } @else if (isTextQuestion(row.question_type)) {
            <p class="report-survey-caption">
              Texto libre — respuestas no vacías: {{ row.text_response_count ?? 0 }}.
              Usa «Descargar Excel» para exportar ID usuario y respuesta.
            </p>

          } @else if (supportsChart(row.question_type) && row.response_count > 0) {

            <p class="report-survey-caption">

              Hay respuestas, pero aún no hay datos agregados para graficar.

            </p>

          } @else if (supportsChart(row.question_type)) {

            <p class="report-survey-caption">Sin respuestas todavía.</p>

          }

        </article>

      }

    }

  `,

})

export class ReportSurveysComponent {
  private readonly api = inject(SurveyQuestionsApiService);
  private readonly errors = inject(ErrorService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly toast = inject(ToastService);
  private readonly globalLoad = inject(LoadingService);
  protected readonly store = inject(ReportStore);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly rows = signal<SurveyQuestionStatRow[]>([]);
  readonly exporting = signal(false);
  readonly exportingPngId = signal<number | null>(null);
  readonly exportingTextId = signal<number | null>(null);

  protected readonly dateFilterLabel = computed(() =>
    surveyStatsDateFilterLabel(this.store.filters()),
  );

  protected readonly hasResponsesInRange = computed(() =>
    this.rows().some((r) => (r.response_count ?? 0) > 0),
  );

  protected readonly chartEntries = surveyChartEntries;
  protected readonly chartVariant = surveyChartVariant;
  protected readonly supportsChart = questionTypeSupportsChart;
  protected readonly isTextQuestion = isSurveyTextQuestion;

  constructor() {
    this.loadStats();
  }

  onFromDateChange(value: string): void {
    this.store.setFilters({ fromDate: value });
    this.loadStats();
  }

  onToDateChange(value: string): void {
    this.store.setFilters({ toDate: value });
    this.loadStats();
  }

  clearDateFilters(): void {
    this.store.setFilters({ fromDate: '', toDate: '' });
    this.loadStats();
  }

  private queryParams(): Record<string, string> | undefined {
    return buildSurveyStatsQueryParams(this.store.filters());
  }

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api
      .statsSummary(this.queryParams())
      .pipe(take(1), takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (list) => {
          this.rows.set(Array.isArray(list) ? list : []);
          this.loading.set(false);
        },
        error: (err) => {
          this.loading.set(false);
          this.error.set('No se pudieron cargar las estadísticas de encuesta.');
          this.errors.handle(err);
        },
      });
  }

  async downloadExcel(): Promise<void> {
    const list = this.rows();
    if (!list.length) {
      this.toast.warn('No hay datos de encuesta para exportar.');
      return;
    }
    this.exporting.set(true);
    try {
      await this.globalLoad.run('Exportando reporte de encuestas…', () =>
        downloadSurveyStatsExcel(list, this.dateFilterLabel()),
      );
      this.toast.success('Informe de encuestas exportado a Excel.');
    } catch {
      this.toast.warn('No se pudo generar el archivo Excel.');
    } finally {
      this.exporting.set(false);
    }
  }



  downloadChartPng(row: SurveyQuestionStatRow): void {

    const entries = surveyChartEntries(row);

    if (!entries.length) return;



    this.exportingPngId.set(row.question_id);
    this.globalLoad.begin('Exportando gráfica…');

    try {

      const base64 = renderSurveyChartPngBase64(

        entries,

        surveyChartVariant(row),

        row.label,

      );

      if (!base64) {

        this.toast.warn('No se pudo generar la imagen de la gráfica.');

        return;

      }

      downloadPngBase64(base64, surveyChartPngFilename(row.label, row.question_id));

      this.toast.success('Gráfica descargada en PNG.');

    } catch {

      this.toast.warn('No se pudo exportar la gráfica.');

    } finally {
      this.globalLoad.end();
      this.exportingPngId.set(null);
    }
  }

  async downloadTextExcel(row: SurveyQuestionStatRow): Promise<void> {
    if (!isSurveyTextQuestion(row.question_type)) return;
    if ((row.text_response_count ?? 0) <= 0) {
      this.toast.warn('No hay respuestas de texto para exportar.');
      return;
    }

    this.exportingTextId.set(row.question_id);
    try {
      await this.globalLoad.run('Exportando respuestas de texto…', async () => {
        const responses = await firstValueFrom(
          this.api.textResponses(row.question_id, this.queryParams()),
        );
        if (!responses.length) {
          this.toast.warn('No hay respuestas de texto para exportar.');
          return;
        }
        await downloadSurveyTextResponsesExcel(
          row.question_id,
          row.label,
          responses,
          this.dateFilterLabel(),
        );
        this.toast.success('Respuestas de texto exportadas a Excel.');
      });
    } catch {
      this.toast.warn('No se pudo exportar las respuestas de texto.');
    } finally {
      this.exportingTextId.set(null);
    }
  }

  typeLabel(t: string): string {

    return SURVEY_TYPE_LABEL_ES[t] ?? t;

  }



  kindLabel(k: string): string {

    return CONTRACT_KIND_LABEL_ES[k] ?? k;

  }

}

