import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { Api } from '../../../core/services/api';
import { ApiMeta } from '../../../core/models/api-response';
import { FilterParams } from '../../../core/models/filter-params';
import { CampaignAdminDetail, CampaignAdminListItem, CampaignEditPayload, CampaignWritePayload } from '../models/campaign';

/** Method names mirror the backend's admin-newsletter-campaigns routes -
 * listAdmin ⇄ listCampaigns, getForEdit ⇄ getCampaignForEdit, etc. (see
 * business-partner.ts/coupon.ts for the same convention). Permission
 * `manage_marketing`, NOT module-gated. */
@Injectable({ providedIn: 'root' })
export class Campaign {
  private api = inject(Api);

  listAdmin(params: FilterParams): Observable<{ data: CampaignAdminListItem[]; meta?: ApiMeta }> {
    return this.api.getList<CampaignAdminListItem[]>('admin/newsletter-campaigns', params);
  }

  /** Display shape - GET /admin/newsletter-campaigns/:id. Fine for a read-only
   * detail view, NOT for a form. */
  getById(id: string): Observable<CampaignAdminDetail> {
    return this.api.get<CampaignAdminDetail>(`admin/newsletter-campaigns/${id}`);
  }

  /** Raw/edit shape - GET /admin/newsletter-campaigns/:id/edit. Use this to
   * populate the admin form. */
  getForEdit(id: string): Observable<CampaignEditPayload> {
    return this.api.get<CampaignEditPayload>(`admin/newsletter-campaigns/${id}/edit`);
  }

  create(payload: CampaignWritePayload): Observable<CampaignEditPayload> {
    return this.api.post<CampaignEditPayload>('admin/newsletter-campaigns', payload);
  }

  update(id: string, payload: CampaignWritePayload): Observable<CampaignEditPayload> {
    return this.api.put<CampaignEditPayload>(`admin/newsletter-campaigns/${id}`, payload);
  }

  /** PUT .../:id/send - sends the campaign immediately, bypassing any schedule.
   * Irreversible - callers must confirm() before calling this. Returns the
   * updated display shape with `poslato`/`neuspesno` counts filled in. */
  sendNow(id: string): Observable<CampaignAdminDetail> {
    return this.api.put<CampaignAdminDetail>(`admin/newsletter-campaigns/${id}/send`, {});
  }

  delete(id: string): Observable<{ message: string }> {
    return this.api.delete<{ message: string }>(`admin/newsletter-campaigns/${id}`);
  }
}
