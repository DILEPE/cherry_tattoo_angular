import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStore } from '../../../../store/app.store';
import { PANEL_MODULE_LABELS } from '../../../auth/models/panel-auth.model';
import { PANEL_SESSION_TTL_MS } from '../../../auth/models/panel-session.util';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { AppIconComponent, AppIconName } from '../../../../shared/ui/icon/app-icon.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

const SIDEBAR_COLLAPSED_KEY = 'cherry_panel_sidebar_collapsed';

interface NavItem {
  key: string;
  label: string;
  icon: AppIconName;
  path: string;
}

const NAV_ICONS: Record<string, AppIconName> = {
  citas: 'calendar',
  clientes: 'users',
  contratos: 'fileContract',
  encuestas: 'clipboardList',
  reporte: 'barChart',
  tiendas: 'store',
  usuarios_panel: 'userCog',
};

@Component({
  selector: 'app-panel-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AppButtonComponent, AppIconComponent],
  template: `
    <div
      class="panel-layout panel-fade-in"
      [class.panel-layout--collapsed]="sidebarCollapsed()"
    >
      <aside class="panel-sidebar" [attr.aria-expanded]="!sidebarCollapsed()">
        <div class="panel-sidebar__head">
          <a routerLink="/citas" class="panel-sidebar__brand" title="Cherry Ink · Rock City">
            <img
              class="panel-sidebar__logo"
              src="/assets/rock-city-logo.png"
              alt=""
              width="40"
              height="40"
            />
            <span class="panel-sidebar__brand-text">
              <strong>Cherry Ink</strong>
              <span class="panel-sidebar__subtitle">Rock City</span>
            </span>
          </a>
          <button
            type="button"
            class="panel-sidebar__toggle"
            (click)="toggleSidebar()"
            [attr.aria-label]="sidebarCollapsed() ? 'Expandir menú' : 'Comprimir menú'"
            [attr.title]="sidebarCollapsed() ? 'Expandir menú' : 'Comprimir menú'"
          >
            <span class="panel-sidebar__toggle-icon" aria-hidden="true"></span>
          </button>
        </div>

        @if (user(); as u) {
          <div class="panel-sidebar__user-block">
            <p class="panel-sidebar__user" [title]="u.username + ' · ' + u.role">
              <span class="panel-sidebar__user-name">{{ u.username }}</span>
              <span class="panel-sidebar__user-role">{{ u.role }}</span>
            </p>
            <p class="panel-sidebar__session" [title]="'Sesión: ' + sessionMinutesLeft() + ' min'">
              {{ sessionMinutesLeft() }} min
            </p>
          </div>
        }

        <nav class="panel-sidebar__nav" aria-label="Módulos del panel">
          @for (item of navItems(); track item.key) {
            <a
              class="panel-sidebar__link"
              routerLinkActive="panel-sidebar__link--active"
              [routerLink]="item.path"
              [title]="item.label"
            >
              <span class="panel-sidebar__link-icon" aria-hidden="true">
                <app-icon [name]="item.icon" [size]="20" />
              </span>
              <span class="panel-sidebar__link-label">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="panel-sidebar__footer">
          <app-button variant="ghost" type="button" (clicked)="logout()">
            <span class="panel-sidebar__logout-icon" aria-hidden="true">
              <app-icon name="logOut" [size]="20" />
            </span>
            <span class="panel-sidebar__logout-label">Cerrar sesión</span>
          </app-button>
        </div>
      </aside>

      <main class="panel-main">
        <router-outlet />
      </main>
    </div>
  `,
})
export class PanelShellComponent implements OnInit, OnDestroy {
  protected readonly appStore = inject(AppStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly user = this.appStore.user;
  readonly sidebarCollapsed = signal(this.readSidebarCollapsed());

  private sessionTimer: ReturnType<typeof setInterval> | null = null;

  ngOnInit(): void {
    this.appStore.initFromSession();
    this.sessionTimer = setInterval(() => this.checkSessionExpiry(), 30_000);
  }

  ngOnDestroy(): void {
    if (this.sessionTimer !== null) {
      clearInterval(this.sessionTimer);
    }
  }

  toggleSidebar(): void {
    const next = !this.sidebarCollapsed();
    this.sidebarCollapsed.set(next);
    try {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? '1' : '0');
    } catch {
      /* ignore quota / private mode */
    }
  }

  sessionMinutesLeft(): number {
    const exp = this.user()?.sessionExpiresAt;
    if (!exp) return 0;
    return Math.max(0, Math.ceil((exp - Date.now()) / 60_000));
  }

  private checkSessionExpiry(): void {
    if (!this.appStore.user()) return;
    if (this.appStore.ensureSessionValid()) return;
    this.toast.warn('Tu sesión expiró (60 min). Inicia sesión de nuevo.');
    void this.router.navigateByUrl('/login');
  }

  navItems(): NavItem[] {
    const items: NavItem[] = [];
    const order = [
      'citas',
      'clientes',
      'contratos',
      'encuestas',
      'reporte',
      'tiendas',
      'usuarios_panel',
    ];
    for (const key of order) {
      if (this.appStore.canAccessModule(key)) {
        items.push({
          key,
          label: PANEL_MODULE_LABELS[key] ?? key,
          icon: NAV_ICONS[key] ?? 'document',
          path: `/${key}`,
        });
      }
    }
    return items;
  }

  logout(): void {
    this.appStore.ensureSessionValid();
    this.appStore.logout();
    void this.router.navigateByUrl('/login');
  }

  private readSidebarCollapsed(): boolean {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1';
    } catch {
      return false;
    }
  }
}
