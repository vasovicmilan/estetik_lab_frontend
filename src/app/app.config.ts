import { ApplicationConfig, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { ssrClientInterceptor } from './core/interceptors/ssr-client-interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SerbianPaginatorIntl } from './shared/ui/pagination/page-size';
import { provideSerbianDateAdapter } from './shared/ui/date-picker/serbian-date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    { provide: MatPaginatorIntl, useClass: SerbianPaginatorIntl },
    provideRouter(routes, withComponentInputBinding()),
    provideClientHydration(withEventReplay()),
    provideHttpClient(withFetch(), withInterceptors([ssrClientInterceptor, authInterceptor, errorInterceptor])),
    provideAnimationsAsync(),
    // dd.MM.yyyy display/parsing for every mat-datepicker in the app (see
    // shared/ui/date-picker) - there was no DateAdapter/MAT_DATE_LOCALE
    // provider anywhere before this.
    provideSerbianDateAdapter(),
  ],
};
