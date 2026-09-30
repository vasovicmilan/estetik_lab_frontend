import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners } from '@angular/core';
import { provideRouter, withComponentInputBinding } from '@angular/router';
import { provideHttpClient, withFetch, withInterceptors } from '@angular/common/http';
import { provideClientHydration, Title, withEventReplay } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app.routes';
import { SiteInfo } from './core/services/site-info';
import { ssrClientInterceptor } from './core/interceptors/ssr-client-interceptor';
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { errorInterceptor } from './core/interceptors/error-interceptor';
import { MatPaginatorIntl } from '@angular/material/paginator';
import { SerbianPaginatorIntl } from './shared/ui/pagination/page-size';
import { provideSerbianDateAdapter } from './shared/ui/date-picker/serbian-date-adapter';

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    // podaci o firmi + uključeni moduli pre prvog rendera (i na serveru)
    provideAppInitializer(() => {
      const site = inject(SiteInfo);
      const title = inject(Title);
      // podrazumevani <title> je naziv firme iz baze (stranice ga zatim menjaju preko SEO servisa)
      return site.load().then(() => {
        if (site.name()) title.setTitle(site.name());
      });
    }),
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
