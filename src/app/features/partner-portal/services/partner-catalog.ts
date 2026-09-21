import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { PartnerCatalog } from '../models/catalog';

/** GET /partner/catalog?search=&servicesPage=&packagesPage=&productsPage= -
 * the partner's public referral catalog (services/packages/products each with a
 * referralLink baked in server-side). */
@Injectable({ providedIn: 'root' })
export class PartnerCatalogService {
  private api = inject(Api);

  get(params: { search?: string; servicesPage?: number; packagesPage?: number; productsPage?: number }): Observable<PartnerCatalog> {
    return this.api.get<PartnerCatalog>('partner/catalog', params);
  }
}
