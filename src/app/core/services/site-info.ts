import { Injectable, computed, inject, signal } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { Api } from './api';
import { ALL_MODULES_ON, BusinessInfo, BusinessInfoResponse, SiteModules, toBusinessInfo } from '../models/business-info';

/**
 * Javni podaci o firmi + koji moduli (blog/shop/booking...) postoje u ovoj instanci -
 * jedan izvor istine je backend (GET /business-info). Učitava se jednom pri startu aplikacije
 * (provideAppInitializer u app.config.ts), pa i SSR HTML odmah ima tačne linkove.
 * Ako API ne odgovori, sve ostaje uključeno (ponašanje kao pre) - nikad blokada sajta.
 */
@Injectable({ providedIn: 'root' })
export class SiteInfo {
  private api = inject(Api);

  readonly info = signal<BusinessInfo | null>(null);
  readonly modules = computed<SiteModules>(() => this.info()?.modules ?? ALL_MODULES_ON);
  readonly name = computed(() => this.info()?.name ?? '');
  readonly tagline = computed(() => this.info()?.tagline ?? '');

  async load(): Promise<void> {
    try {
      const response = await firstValueFrom(this.api.get<BusinessInfoResponse>('business-info'));
      this.info.set(toBusinessInfo(response));
    } catch (error) {
      console.warn('Failed to load business info:', error);
    }
  }
}
