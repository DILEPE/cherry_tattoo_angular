import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type AppIconName =
  | 'edit'
  | 'trash'
  | 'document'
  | 'send'
  | 'userOff'
  | 'userPlus'
  | 'calendar'
  | 'users'
  | 'fileContract'
  | 'clipboardList'
  | 'barChart'
  | 'store'
  | 'userCog'
  | 'logOut';

@Component({
  selector: 'app-icon',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg
      class="app-icon"
      [attr.width]="size()"
      [attr.height]="size()"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      aria-hidden="true"
    >
      @switch (name()) {
        @case ('edit') {
          <path d="M12 20h9" />
          <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
        }
        @case ('trash') {
          <path d="M3 6h18" />
          <path d="M8 6V4h8v2" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
          <path d="M10 11v6" />
          <path d="M14 11v6" />
        }
        @case ('document') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M16 13H8" />
          <path d="M16 17H8" />
          <path d="M10 9H8" />
        }
        @case ('send') {
          <path d="m22 2-7 20-4-9-9-4Z" />
          <path d="M22 2 11 13" />
        }
        @case ('userOff') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="m17 8 5 5" />
          <path d="m22 8-5 5" />
        }
        @case ('userPlus') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M19 8v6" />
          <path d="M16 11h6" />
        }
        @case ('calendar') {
          <path d="M8 2v4" />
          <path d="M16 2v4" />
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <path d="M3 10h18" />
          <path d="M8 14h.01" />
          <path d="M12 14h.01" />
          <path d="M16 14h.01" />
        }
        @case ('users') {
          <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        }
        @case ('fileContract') {
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
          <path d="M14 2v6h6" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
          <path d="M9 9h2" />
        }
        @case ('clipboardList') {
          <rect x="8" y="2" width="8" height="4" rx="1" />
          <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
          <path d="M9 12h6" />
          <path d="M9 16h6" />
          <path d="M9 8h6" />
        }
        @case ('barChart') {
          <path d="M12 20V10" />
          <path d="M18 20V4" />
          <path d="M6 20V14" />
        }
        @case ('store') {
          <path d="M3 9 5 3h14l2 6" />
          <path d="M3 9v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V9" />
          <path d="M9 22V12h6v10" />
        }
        @case ('userCog') {
          <circle cx="10" cy="8" r="4" />
          <path d="M10.3 14H7a4 4 0 0 0-4 4v2" />
          <circle cx="18" cy="16" r="2" />
          <path d="m20.7 17.7-.9.9" />
          <path d="m17.3 20.3.9-.9" />
          <path d="m20.7 14.3-.9-.9" />
          <path d="m17.3 11.7.9.9" />
          <path d="m21.6 16h-1.3" />
          <path d="M16 16h1.3" />
        }
        @case ('logOut') {
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
          <path d="m16 17 5-5-5-5" />
          <path d="M21 12H9" />
        }
      }
    </svg>
  `,
  styles: [
    `
      :host {
        display: inline-flex;
        line-height: 0;
        color: currentColor;
      }
      .app-icon {
        display: block;
        flex-shrink: 0;
      }
    `,
  ],
})
export class AppIconComponent {
  readonly name = input.required<AppIconName>();
  readonly size = input(16);
}
