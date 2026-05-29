import {

  ChangeDetectionStrategy,

  Component,

  computed,

  input,

} from '@angular/core';

import {

  SurveyChartEntry,

  SurveyChartVariant,

  surveyChartColor,

  surveyChartTotal,

  surveyPieConicGradient,

  surveyPieSliceLabels,

  truncateSurveyChartLabel,

} from '../../models/survey-chart.util';



@Component({

  selector: 'app-survey-breakdown-chart',

  standalone: true,

  changeDetection: ChangeDetectionStrategy.OnPush,

  template: `

    @if (variant() === 'pie') {

      <div class="survey-chart survey-chart--pie">

        <div class="survey-chart__pie-wrap survey-chart__pie-wrap--relief">
          <div class="survey-chart__pie-shadow" aria-hidden="true"></div>
          <div class="survey-chart__pie-stage">
            <div
              class="survey-chart__pie"
              [style.background]="pieGradient()"
              role="img"
              [attr.aria-label]="ariaLabel()"
            ></div>
            <div class="survey-chart__pie-gloss" aria-hidden="true"></div>
            <div class="survey-chart__pie-well" aria-hidden="true"></div>
            @for (label of pieLabels(); track label.left + label.pct) {
              <span
                class="survey-chart__pie-label"
                [style.left]="label.left"
                [style.top]="label.top"
              >
                {{ label.pct }}%
              </span>
            }
          </div>

        </div>

        <ul class="survey-chart__legend">

          @for (entry of entries(); track entry.key; let i = $index) {

            <li class="survey-chart__legend-item">

              <span
                class="survey-chart__swatch survey-chart__swatch--relief"
                [style.--survey-swatch-color]="colorAt(i)"
              ></span>

              <span class="survey-chart__legend-label" [title]="entry.key">

                {{ truncate(entry.key) }}

              </span>

              <span class="survey-chart__legend-value">

                {{ entry.count }}

                <span class="survey-chart__pct">({{ pct(entry) }}%)</span>

              </span>

            </li>

          }

        </ul>

      </div>

    } @else {

      <div class="survey-chart survey-chart--bar" role="img" [attr.aria-label]="ariaLabel()">

        @for (entry of entries(); track entry.key; let i = $index) {

          <div class="survey-chart__bar-row">

            <span class="survey-chart__bar-label" [title]="entry.key">{{ truncate(entry.key) }}</span>

            <div class="survey-chart__bar-track">

              <div
                class="survey-chart__bar-fill"
                [style.width.%]="barWidth(entry)"
                [style.--survey-bar-color]="colorAt(i)"
              >

                @if (showBarPctInside(entry)) {

                  <span class="survey-chart__bar-pct">{{ pct(entry) }}%</span>

                }

              </div>

              @if (!showBarPctInside(entry)) {

                <span

                  class="survey-chart__bar-pct survey-chart__bar-pct--outside"

                  [style.left.%]="barWidth(entry)"

                >

                  {{ pct(entry) }}%

                </span>

              }

            </div>

            <span class="survey-chart__bar-count">{{ entry.count }}</span>

          </div>

        }

      </div>

    }

  `,

})

export class SurveyBreakdownChartComponent {

  readonly entries = input.required<SurveyChartEntry[]>();

  readonly variant = input<SurveyChartVariant>('pie');

  readonly title = input('Distribución de respuestas');



  protected readonly total = computed(() => surveyChartTotal(this.entries()));



  protected readonly pieGradient = computed(

    () => surveyPieConicGradient(this.entries()) ?? 'transparent',

  );



  protected readonly pieLabels = computed(() => surveyPieSliceLabels(this.entries()));



  protected truncate = truncateSurveyChartLabel;



  protected colorAt(index: number): string {

    return surveyChartColor(index);

  }



  protected pct(entry: SurveyChartEntry): string {

    const t = this.total();

    if (t <= 0) return '0';

    return ((entry.count / t) * 100).toFixed(1);

  }



  protected barWidth(entry: SurveyChartEntry): number {

    const t = this.total();

    if (t <= 0) return 0;

    return Math.max(4, (entry.count / t) * 100);

  }



  protected showBarPctInside(entry: SurveyChartEntry): boolean {

    return this.barWidth(entry) >= 22;

  }



  protected ariaLabel(): string {

    const parts = this.entries()

      .map((e) => `${e.key}: ${e.count} (${this.pct(e)}%)`)

      .join(', ');

    return `${this.title()}. ${parts}`;

  }

}

