import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AppStore } from '../../../../store/app.store';
import { AppToastContainerComponent } from '../../../../shared/ui/toast/app-toast-container.component';
import { PANEL_MODULE_LABELS } from '../../../auth/models/panel-auth.model';
import { AppButtonComponent } from '../../../../shared/ui/button/app-button.component';

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
    AppToastContainerComponent,
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
          <app-button variant="ghost" (clicked)="logout()">Cerrar sesión</app-button>
        </div>
      </aside>
      <main class="panel-main">
        <p class="neon-title">Panel de operaciones</p>
        <router-outlet />
      </main>
    </div>
    <app-toast-container />
  `,
})
export class PanelShellComponent implements OnInit {
  protected readonly appStore = inject(AppStore);
  private readonly router = inject(Router);

  readonly user = this.appStore.user;

  ngOnInit(): void {
    this.appStore.initFromSession();
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
    this.appStore.logout();
    void this.router.navigateByUrl('/login');
  }
}
