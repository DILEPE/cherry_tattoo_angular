import { ChangeDetectionStrategy, Component, inject, OnDestroy, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStore } from '../../../../store/app.store';
import { PANEL_MODULE_LABELS } from '../../../auth/models/panel-auth.model';
import { PANEL_SESSION_TTL_MS } from '../../../auth/models/panel-session.util';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';
import { ToastService } from '../../../../shared/ui/toast/toast.service';

interface NavItem {
  key: string;
  label: string;
  path: string;
}

@Component({
  selector: 'app-panel-shell',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    AppButtonComponent,
  ],
  template: `
    <div class="panel-layout panel-fade-in">
      <aside class="panel-sidebar">
        <div class="panel-sidebar__brand">
          <strong>Cherry Ink</strong>
          <div class="panel-sidebar__subtitle">Rock City Panel</div>
        </div>
        @if (user(); as u) {
          <p class="panel-sidebar__user">{{ u.username }} · {{ u.role }}</p>
          <p class="panel-sidebar__session">Sesión: {{ sessionMinutesLeft() }} min restantes</p>
        }
        <nav class="panel-sidebar__nav">
          @for (item of navItems(); track item.key) {
            <a
              class="panel-sidebar__link"
              routerLinkActive="panel-sidebar__link--active"
              [routerLink]="item.path"
            >
              {{ item.label }}
            </a>
          }
        </nav>
        <div class="panel-sidebar__footer">
          <app-button variant="ghost" type="button" (clicked)="logout()">
            Cerrar sesión
          </app-button>
        </div>
      </aside>
      <main class="panel-main">
        <p class="neon-title">Panel de operaciones</p>
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
}
