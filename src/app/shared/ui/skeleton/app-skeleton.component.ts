import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-skeleton',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (row of rowsArray(); track $index) {
      <div class="skeleton-line" [style.width.%]="widthPercent($index)"></div>
    }
  `,
  styles: [
    `
      :host {
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      }
    `,
  ],
})
export class AppSkeletonComponent {
  readonly rows = input(5);

  rowsArray(): number[] {
    return Array.from({ length: this.rows() }, (_, i) => i);
  }

  widthPercent(index: number): number {
    const widths = [100, 92, 88, 95, 80];
    return widths[index % widths.length];
  }
}
