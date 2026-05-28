import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { EnvironmentProviders, makeEnvironmentProviders } from '@angular/core';

export function provideCore(): EnvironmentProviders {
  return makeEnvironmentProviders([provideHttpClient(withInterceptorsFromDi())]);
}
