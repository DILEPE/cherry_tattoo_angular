import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { AppGlobalLoaderComponent } from './shared/ui/global-loader/app-global-loader.component';
import { AppToastContainerComponent } from './shared/ui/toast/app-toast-container.component';
import { AppStore } from './store/app.store';

@Component({
  selector: 'app-root',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterOutlet, AppToastContainerComponent, AppGlobalLoaderComponent],
  template: `
    <router-outlet />
    <app-global-loader />
    <app-toast-container />
  `,
  styles: [`:host { display: block; min-height: 100vh; }`],
})
export class AppComponent implements OnInit {
  private readonly appStore = inject(AppStore);

  ngOnInit(): void {
    this.appStore.initFromSession();
    this.appStore.ensureSessionValid();
  }
}
