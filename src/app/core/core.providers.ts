import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';
import { loadingInterceptor } from './interceptors/loading.interceptor';
import { provideNavigationLoading } from './navigation-loading.initializer';

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([
    provideHttpClient(withInterceptors([loadingInterceptor])),
    provideNavigationLoading(),
  ]);
}
