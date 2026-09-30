import { CanMatchFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { SiteInfo } from '../services/site-info';
import { SiteModules } from '../models/business-info';

/**
 * Ruta postoji samo ako je modul uključen u ovoj instanci (isto što backend radi sa requireModule -
 * tamo je 404). Ovde se posetilac vraća na početnu umesto na grešku "Cannot match any routes".
 * canMatch (ne canActivate) da se lazy chunk isključenog modula nikad ni ne učita.
 */
export const moduleGuard =
  (moduleName: keyof SiteModules): CanMatchFn =>
  () => {
    if (inject(SiteInfo).modules()[moduleName]) return true;
    return inject(Router).createUrlTree(['/']);
  };
